import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import type { Elysia } from 'elysia';

describe('Overtime API E2E Tests', () => {
  let app: Elysia;
  let baseURL: string;

  beforeAll(async () => {
    const { Elysia: ElysiaClass } = await import('elysia');
    const { cors } = await import('@elysiajs/cors');
    const { createTestDb } = await import('../setup');
    const { overtimeEntries } = await import('../../lib/db/schema');
    const { overtimeEntrySchema } = await import('../../lib/validations');
    const { calculateHours } = await import('../../lib/utils');
    const { eq, desc, and, gte, lte, sql } = await import('drizzle-orm');

    const testDb = createTestDb();
    const db = testDb.db;

    const overtimeRoutes = new ElysiaClass({ prefix: '/api/overtime' })
      .get('/', async ({ query }) => {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const offset = (page - 1) * limit;
        const startDate = query.startDate;
        const endDate = query.endDate;
        const type = query.type;

        const conditions = [];
        if (startDate) conditions.push(gte(overtimeEntries.date, startDate));
        if (endDate) conditions.push(lte(overtimeEntries.date, endDate));
        if (type === 'worked' || type === 'used') conditions.push(eq(overtimeEntries.type, type));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const entries = await db.select().from(overtimeEntries).where(whereClause).orderBy(desc(overtimeEntries.date)).limit(limit).offset(offset);
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(overtimeEntries).where(whereClause);
        const allEntries = await db.select().from(overtimeEntries);

        const totalWorked = allEntries.filter(e => e.type === 'worked').reduce((sum, e) => sum + (e.hours || 0), 0);
        const totalUsed = allEntries.filter(e => e.type === 'used').reduce((sum, e) => sum + (e.hours || 0), 0);
        const balance = totalWorked - totalUsed;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startMonth = new Date(year, month, 1).toISOString().slice(0, 10);
        const endMonth = new Date(year, month + 1, 0).toISOString().slice(0, 10);
        const startYear = `${year}-01-01`;
        const endYear = `${year}-12-31`;

        const workedEntries = allEntries.filter(e => e.type === 'worked');
        const entriesCurrentMonth = workedEntries.filter(e => e.date >= startMonth && e.date <= endMonth);
        const entriesCurrentYear = workedEntries.filter(e => e.date >= startYear && e.date <= endYear);

        return {
          entries,
          pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
          summary: {
            totalWorked,
            totalUsed,
            balance,
            availableDays: Math.round((balance / 8) * 100) / 100,
            monthSummary: { daysWithOvertime: new Set(entriesCurrentMonth.map(e => e.date)).size, totalHours: Math.round(entriesCurrentMonth.reduce((sum, e) => sum + (e.hours || 0), 0) * 10) / 10 },
            yearSummary: { daysWithOvertime: new Set(entriesCurrentYear.map(e => e.date)).size, totalHours: Math.round(entriesCurrentYear.reduce((sum, e) => sum + (e.hours || 0), 0) * 10) / 10 },
          },
        };
      })
      .post('/', async ({ body }) => {
        const validated = overtimeEntrySchema.parse(body);
        let hours = validated.hours;
        if (!hours && validated.startTime && validated.endTime) {
          hours = calculateHours(validated.startTime, validated.endTime);
        }
        const [newEntry] = await db.insert(overtimeEntries).values({ date: validated.date, type: validated.type, hours, startTime: validated.startTime, endTime: validated.endTime, description: validated.description }).returning();
        return newEntry;
      })
      .get('/:id', async ({ params: { id } }) => {
        const entryId = parseInt(id);
        if (isNaN(entryId)) throw new Error('ID inválido');
        const [entry] = await db.select().from(overtimeEntries).where(eq(overtimeEntries.id, entryId));
        if (!entry) throw new Error('Registro não encontrado');
        return entry;
      })
      .put('/:id', async ({ params: { id }, body }) => {
        const entryId = parseInt(id);
        if (isNaN(entryId)) throw new Error('ID inválido');
        const validated = overtimeEntrySchema.parse(body);
        let hours = validated.hours;
        if (!hours && validated.startTime && validated.endTime) {
          hours = calculateHours(validated.startTime, validated.endTime);
        }
        const [updatedEntry] = await db.update(overtimeEntries).set({ date: validated.date, type: validated.type, hours, startTime: validated.startTime, endTime: validated.endTime, description: validated.description }).where(eq(overtimeEntries.id, entryId)).returning();
        if (!updatedEntry) throw new Error('Registro não encontrado');
        return updatedEntry;
      })
      .delete('/:id', async ({ params: { id } }) => {
        const entryId = parseInt(id);
        if (isNaN(entryId)) throw new Error('ID inválido');
        const [deletedEntry] = await db.delete(overtimeEntries).where(eq(overtimeEntries.id, entryId)).returning();
        if (!deletedEntry) throw new Error('Registro não encontrado');
        return { success: true };
      });

    app = new ElysiaClass()
      .use(cors())
      .use(overtimeRoutes)
      .listen(3002);

    baseURL = `http://localhost:3002`;
  });

  afterAll(() => {
    if (app) {
      app.stop();
    }
  });

  it('GET /api/overtime - should list entries with pagination', async () => {
    const response = await fetch(`${baseURL}/api/overtime?page=1&limit=10`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('entries');
    expect(data).toHaveProperty('pagination');
    expect(data).toHaveProperty('summary');
    expect(Array.isArray(data.entries)).toBe(true);
  });

  it('POST /api/overtime - should create entry with direct hours', async () => {
    const newEntry = {
      date: '2025-02-17',
      type: 'worked',
      hours: 2.5,
      description: 'Test entry',
    };

    const response = await fetch(`${baseURL}/api/overtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.date).toBe('2025-02-17');
    expect(data.type).toBe('worked');
    expect(data.hours).toBe(2.5);
    expect(data.description).toBe('Test entry');
  });

  it('POST /api/overtime - should create entry with time range', async () => {
    const newEntry = {
      date: '2025-02-18',
      type: 'worked',
      startTime: '08:00',
      endTime: '10:30',
    };

    const response = await fetch(`${baseURL}/api/overtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.hours).toBe(2.5);
    expect(data.startTime).toBe('08:00');
    expect(data.endTime).toBe('10:30');
  });

  it('POST /api/overtime - should reject invalid data', async () => {
    const invalidEntry = {
      date: '',
      type: 'worked',
    };

    const response = await fetch(`${baseURL}/api/overtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidEntry),
    });

    expect(response.status).toBe(500);
  });

  it('GET /api/overtime?type=worked - should filter by type', async () => {
    const response = await fetch(`${baseURL}/api/overtime?type=worked`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.entries.every((e: any) => e.type === 'worked')).toBe(true);
  });

  it('GET /api/overtime/:id - should get specific entry', async () => {
    const createResponse = await fetch(`${baseURL}/api/overtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-02-19', type: 'used', hours: 4 }),
    });
    const created = await createResponse.json();

    const response = await fetch(`${baseURL}/api/overtime/${created.id}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(created.id);
  });

  it('GET /api/overtime/9999 - should return error for non-existent entry', async () => {
    const response = await fetch(`${baseURL}/api/overtime/9999`);
    expect(response.status).toBe(500);
  });

  it('PUT /api/overtime/:id - should update entry', async () => {
    const createResponse = await fetch(`${baseURL}/api/overtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-02-20', type: 'worked', hours: 2 }),
    });
    const created = await createResponse.json();

    const updateResponse = await fetch(`${baseURL}/api/overtime/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-02-20', type: 'worked', hours: 3, description: 'Updated' }),
    });

    expect(updateResponse.status).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.hours).toBe(3);
    expect(updated.description).toBe('Updated');
  });

  it('DELETE /api/overtime/:id - should delete entry', async () => {
    const createResponse = await fetch(`${baseURL}/api/overtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-02-21', type: 'worked', hours: 2 }),
    });
    const created = await createResponse.json();

    const deleteResponse = await fetch(`${baseURL}/api/overtime/${created.id}`, {
      method: 'DELETE',
    });

    expect(deleteResponse.status).toBe(200);
    const result = await deleteResponse.json();
    expect(result.success).toBe(true);
  });

  it('should calculate summary correctly', async () => {
    const response = await fetch(`${baseURL}/api/overtime`);
    const data = await response.json();

    expect(data.summary).toHaveProperty('totalWorked');
    expect(data.summary).toHaveProperty('totalUsed');
    expect(data.summary).toHaveProperty('balance');
    expect(data.summary).toHaveProperty('availableDays');
    expect(data.summary).toHaveProperty('monthSummary');
    expect(data.summary).toHaveProperty('yearSummary');
  });
});
