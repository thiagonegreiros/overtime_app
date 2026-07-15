/**
 * Migração: introduz a divisão por Projetos.
 *
 * - Cria a tabela `projects`.
 * - Cria o projeto "NTT DATA".
 * - Adiciona a coluna `project_id` em `overtime_entries`.
 * - Associa todo registro sem projeto ao "NTT DATA" (preserva o histórico).
 *
 * Idempotente: pode rodar mais de uma vez sem efeito colateral.
 * Uso: `bun run lib/db/migrate-projects.ts`
 */
import { Database } from 'bun:sqlite';

const DEFAULT_PROJECT = 'NTT DATA';
const db = new Database('overtime.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.query('INSERT OR IGNORE INTO projects (name) VALUES (?)').run(DEFAULT_PROJECT);
const { id: projectId } = db
  .query('SELECT id FROM projects WHERE name = ?')
  .get(DEFAULT_PROJECT) as { id: number };

// Adiciona a coluna project_id apenas se ainda não existir.
const columns = db.query('PRAGMA table_info(overtime_entries)').all() as {
  name: string;
}[];
const hasProjectId = columns.some((c) => c.name === 'project_id');
if (!hasProjectId) {
  db.exec('ALTER TABLE overtime_entries ADD COLUMN project_id INTEGER REFERENCES projects(id)');
}

const { changes } = db
  .query('UPDATE overtime_entries SET project_id = ? WHERE project_id IS NULL')
  .run(projectId);

console.log(
  `✅ Migração concluída. Projeto "${DEFAULT_PROJECT}" (id=${projectId}). ` +
    `${changes} registro(s) associados.`,
);

db.close();
