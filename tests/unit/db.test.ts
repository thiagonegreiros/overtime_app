import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestDb } from '../setup';
import { overtimeEntries } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Database Operations', () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.sqlite.close();
  });

  describe('Create Operations', () => {
    it('should insert a new overtime entry', async () => {
      const [entry] = await testDb.db
        .insert(overtimeEntries)
        .values({
          projectId: 1,
          date: '2025-02-17',
          type: 'worked',
          hours: 2.5,
          description: 'Test entry',
        })
        .returning();

      expect(entry).toBeDefined();
      expect(entry.date).toBe('2025-02-17');
      expect(entry.type).toBe('worked');
      expect(entry.hours).toBe(2.5);
      expect(entry.description).toBe('Test entry');
    });

    it('should insert entry with start and end time', async () => {
      const [entry] = await testDb.db
        .insert(overtimeEntries)
        .values({
          projectId: 1,
          date: '2025-02-17',
          type: 'worked',
          hours: 2,
          startTime: '08:00',
          endTime: '10:00',
        })
        .returning();

      expect(entry.startTime).toBe('08:00');
      expect(entry.endTime).toBe('10:00');
    });

    it('should auto-generate id', async () => {
      const [entry1] = await testDb.db
        .insert(overtimeEntries)
        .values({ projectId: 1, date: '2025-02-17', type: 'worked', hours: 2 })
        .returning();

      const [entry2] = await testDb.db
        .insert(overtimeEntries)
        .values({ projectId: 1, date: '2025-02-18', type: 'used', hours: 1 })
        .returning();

      expect(entry1.id).toBe(1);
      expect(entry2.id).toBe(2);
    });
  });

  describe('Read Operations', () => {
    it('should retrieve all entries', async () => {
      await testDb.db.insert(overtimeEntries).values([
        { projectId: 1, date: '2025-02-17', type: 'worked', hours: 2 },
        { projectId: 1, date: '2025-02-18', type: 'used', hours: 1 },
      ]);

      const entries = await testDb.db.select().from(overtimeEntries);
      expect(entries).toHaveLength(2);
    });

    it('should retrieve entry by id', async () => {
      const [created] = await testDb.db
        .insert(overtimeEntries)
        .values({ projectId: 1, date: '2025-02-17', type: 'worked', hours: 2 })
        .returning();

      const [found] = await testDb.db
        .select()
        .from(overtimeEntries)
        .where(eq(overtimeEntries.id, created.id));

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should filter by type', async () => {
      await testDb.db.insert(overtimeEntries).values([
        { projectId: 1, date: '2025-02-17', type: 'worked', hours: 2 },
        { projectId: 1, date: '2025-02-18', type: 'used', hours: 1 },
        { projectId: 1, date: '2025-02-19', type: 'worked', hours: 3 },
      ]);

      const worked = await testDb.db
        .select()
        .from(overtimeEntries)
        .where(eq(overtimeEntries.type, 'worked'));

      expect(worked).toHaveLength(2);
      expect(worked.every(e => e.type === 'worked')).toBe(true);
    });
  });

  describe('Update Operations', () => {
    it('should update an entry', async () => {
      const [created] = await testDb.db
        .insert(overtimeEntries)
        .values({ projectId: 1, date: '2025-02-17', type: 'worked', hours: 2 })
        .returning();

      const [updated] = await testDb.db
        .update(overtimeEntries)
        .set({ hours: 3, description: 'Updated' })
        .where(eq(overtimeEntries.id, created.id))
        .returning();

      expect(updated.hours).toBe(3);
      expect(updated.description).toBe('Updated');
    });

    it('should update type', async () => {
      const [created] = await testDb.db
        .insert(overtimeEntries)
        .values({ projectId: 1, date: '2025-02-17', type: 'worked', hours: 2 })
        .returning();

      const [updated] = await testDb.db
        .update(overtimeEntries)
        .set({ type: 'used' })
        .where(eq(overtimeEntries.id, created.id))
        .returning();

      expect(updated.type).toBe('used');
    });
  });

  describe('Delete Operations', () => {
    it('should delete an entry', async () => {
      const [created] = await testDb.db
        .insert(overtimeEntries)
        .values({ projectId: 1, date: '2025-02-17', type: 'worked', hours: 2 })
        .returning();

      const [deleted] = await testDb.db
        .delete(overtimeEntries)
        .where(eq(overtimeEntries.id, created.id))
        .returning();

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(created.id);

      const remaining = await testDb.db.select().from(overtimeEntries);
      expect(remaining).toHaveLength(0);
    });

    it('should return undefined when deleting non-existent entry', async () => {
      const result = await testDb.db
        .delete(overtimeEntries)
        .where(eq(overtimeEntries.id, 9999))
        .returning();

      expect(result).toHaveLength(0);
    });
  });
});
