import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const overtimeEntries = sqliteTable('overtime_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id),
  date: text('date').notNull(),
  type: text('type', { enum: ['worked', 'used'] }).notNull(),
  hours: real('hours'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type OvertimeEntry = typeof overtimeEntries.$inferSelect;
export type NewOvertimeEntry = typeof overtimeEntries.$inferInsert;
