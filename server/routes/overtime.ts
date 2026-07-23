import { Elysia, t } from 'elysia';
import { db } from '../../lib/db';
import { overtimeEntries } from '../../lib/db/schema';
import { overtimeEntrySchema } from '../../lib/validations';
import { calculateHours } from '../../lib/utils';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { listMonths } from '../../lib/utils';

export const overtimeRoutes = new Elysia({ prefix: '/api/overtime' })
  .get('/', async ({ query }) => {
    try {
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '10');
      const offset = (page - 1) * limit;
      const startDate = query.startDate;
      const endDate = query.endDate;
      const type = query.type;
      const projectId = query.projectId ? parseInt(query.projectId) : undefined;

      if (!projectId || isNaN(projectId)) {
        throw new Error('projectId é obrigatório');
      }

      const conditions = [eq(overtimeEntries.projectId, projectId)];
      if (startDate) {
        conditions.push(gte(overtimeEntries.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(overtimeEntries.date, endDate));
      }
      if (type === 'worked' || type === 'used') {
        conditions.push(eq(overtimeEntries.type, type));
      }

      const whereClause = and(...conditions);

      const entries = await db
        .select()
        .from(overtimeEntries)
        .where(whereClause)
        .orderBy(desc(overtimeEntries.date))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(overtimeEntries)
        .where(whereClause);

      // Resumo é escopado ao projeto (saldo por projeto, ADR 0001), ignorando
      // os filtros de data/tipo da listagem.
      const allEntries = await db
        .select()
        .from(overtimeEntries)
        .where(eq(overtimeEntries.projectId, projectId));

      const totalWorked = allEntries
        .filter(e => e.type === 'worked')
        .reduce((sum, e) => sum + (e.hours || 0), 0);

      const totalUsed = allEntries
        .filter(e => e.type === 'used')
        .reduce((sum, e) => sum + (e.hours || 0), 0);

      const balance = totalWorked - totalUsed;
      const availableDays = balance / 8;

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDayMonth = new Date(year, month, 1);
      const lastDayMonth = new Date(year, month + 1, 0);
      const startMonth = firstDayMonth.toISOString().slice(0, 10);
      const endMonth = lastDayMonth.toISOString().slice(0, 10);
      const startYear = `${year}-01-01`;
      const endYear = `${year}-12-31`;

      const workedEntries = allEntries.filter(e => e.type === 'worked');

      const entriesCurrentMonth = workedEntries.filter(
        e => e.date >= startMonth && e.date <= endMonth
      );
      const monthDaysWithOvertime = new Set(entriesCurrentMonth.map(e => e.date)).size;
      const monthTotalHours = entriesCurrentMonth.reduce((sum, e) => sum + (e.hours || 0), 0);

      const entriesCurrentYear = workedEntries.filter(
        e => e.date >= startYear && e.date <= endYear
      );
      const yearDaysWithOvertime = new Set(entriesCurrentYear.map(e => e.date)).size;
      const yearTotalHours = entriesCurrentYear.reduce((sum, e) => sum + (e.hours || 0), 0);

      return {
        entries,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
        summary: {
          totalWorked,
          totalUsed,
          balance,
          availableDays: Math.round(availableDays * 100) / 100,
          monthSummary: {
            daysWithOvertime: monthDaysWithOvertime,
            totalHours: Math.round(monthTotalHours * 10) / 10,
          },
          yearSummary: {
            daysWithOvertime: yearDaysWithOvertime,
            totalHours: Math.round(yearTotalHours * 10) / 10,
          },
        },
      };
    } catch (error) {
      console.error('Error fetching overtime entries:', error);
      throw new Error('Erro ao buscar registros');
    }
  })
  .post('/', async ({ body }) => {
    try {
      const validated = overtimeEntrySchema.parse(body);

      let hours = validated.hours;
      if (!hours && validated.startTime && validated.endTime) {
        hours = calculateHours(validated.startTime, validated.endTime);
      }

      const [newEntry] = await db
        .insert(overtimeEntries)
        .values({
          projectId: validated.projectId,
          date: validated.date,
          type: validated.type,
          hours,
          startTime: validated.startTime,
          endTime: validated.endTime,
          description: validated.description,
        })
        .returning();

      return newEntry;
    } catch (error) {
      console.error('Error creating overtime entry:', error);
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        throw new Error('Dados inválidos');
      }
      throw new Error('Erro ao criar registro');
    }
  })
  .get('/monthly', async ({ query }) => {
    try {
      const projectId = query.projectId ? parseInt(query.projectId) : undefined;
      const startMonth = query.startMonth; // YYYY-MM
      const endMonth = query.endMonth; // YYYY-MM

      if (!projectId || isNaN(projectId)) {
        throw new Error('projectId é obrigatório');
      }
      if (!startMonth || !endMonth || !/^\d{4}-\d{2}$/.test(startMonth) || !/^\d{4}-\d{2}$/.test(endMonth)) {
        throw new Error('startMonth e endMonth são obrigatórios (formato YYYY-MM)');
      }

      const months = listMonths(startMonth, endMonth);
      if (months.length === 0) {
        throw new Error('Período inválido: o mês inicial deve ser anterior ou igual ao final');
      }
      if (months.length > 12) {
        throw new Error('O período do relatório não pode exceder 12 meses');
      }

      // Range de datas cobrindo o período inteiro (do primeiro dia do mês
      // inicial ao último dia do mês final).
      const startDate = `${startMonth}-01`;
      const [endYear, endMon] = endMonth.split('-').map(Number);
      const lastDay = new Date(endYear, endMon, 0).getDate();
      const endDate = `${endMonth}-${String(lastDay).padStart(2, '0')}`;

      // Só horas trabalhadas (worked), agregadas por mês (YYYY-MM).
      const monthExpr = sql<string>`substr(${overtimeEntries.date}, 1, 7)`;
      const rows = await db
        .select({
          month: monthExpr,
          totalHours: sql<number>`coalesce(sum(${overtimeEntries.hours}), 0)`,
          daysWithOvertime: sql<number>`count(distinct ${overtimeEntries.date})`,
        })
        .from(overtimeEntries)
        .where(
          and(
            eq(overtimeEntries.projectId, projectId),
            eq(overtimeEntries.type, 'worked'),
            gte(overtimeEntries.date, startDate),
            lte(overtimeEntries.date, endDate),
          ),
        )
        .groupBy(monthExpr);

      const byMonth = new Map(rows.map((r) => [r.month, r]));

      // Preenche todos os meses do período (inclusive os sem registros).
      const data = months.map((month) => {
        const row = byMonth.get(month);
        return {
          month,
          totalHours: Math.round((row?.totalHours ?? 0) * 10) / 10,
          daysWithOvertime: row?.daysWithOvertime ?? 0,
        };
      });

      const totalHours = Math.round(
        data.reduce((sum, d) => sum + d.totalHours, 0) * 10,
      ) / 10;
      const totalDays = data.reduce((sum, d) => sum + d.daysWithOvertime, 0);

      return { data, totals: { totalHours, totalDays } };
    } catch (error) {
      console.error('Error building monthly report:', error);
      throw error instanceof Error ? error : new Error('Erro ao gerar relatório');
    }
  })
  .get('/:id', async ({ params: { id } }) => {
    try {
      const entryId = parseInt(id);
      if (isNaN(entryId)) {
        throw new Error('ID inválido');
      }

      const [entry] = await db
        .select()
        .from(overtimeEntries)
        .where(eq(overtimeEntries.id, entryId));

      if (!entry) {
        throw new Error('Registro não encontrado');
      }

      return entry;
    } catch (error) {
      console.error('Error fetching overtime entry:', error);
      throw error;
    }
  })
  .put('/:id', async ({ params: { id }, body }) => {
    try {
      const entryId = parseInt(id);
      if (isNaN(entryId)) {
        throw new Error('ID inválido');
      }

      const validated = overtimeEntrySchema.parse(body);

      let hours = validated.hours;
      if (!hours && validated.startTime && validated.endTime) {
        hours = calculateHours(validated.startTime, validated.endTime);
      }

      const [updatedEntry] = await db
        .update(overtimeEntries)
        .set({
          projectId: validated.projectId,
          date: validated.date,
          type: validated.type,
          hours,
          startTime: validated.startTime,
          endTime: validated.endTime,
          description: validated.description,
        })
        .where(eq(overtimeEntries.id, entryId))
        .returning();

      if (!updatedEntry) {
        throw new Error('Registro não encontrado');
      }

      return updatedEntry;
    } catch (error) {
      console.error('Error updating overtime entry:', error);
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        throw new Error('Dados inválidos');
      }
      throw error;
    }
  })
  .delete('/:id', async ({ params: { id } }) => {
    try {
      const entryId = parseInt(id);
      if (isNaN(entryId)) {
        throw new Error('ID inválido');
      }

      const [deletedEntry] = await db
        .delete(overtimeEntries)
        .where(eq(overtimeEntries.id, entryId))
        .returning();

      if (!deletedEntry) {
        throw new Error('Registro não encontrado');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting overtime entry:', error);
      throw error;
    }
  });
