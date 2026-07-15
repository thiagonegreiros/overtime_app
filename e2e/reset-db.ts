/**
 * Reseta e semeia o banco de dados usado pelos testes e2e (Playwright).
 *
 * - Apaga o arquivo de banco de teste e recria o schema do zero.
 * - Semeia um projeto "NTT DATA" para o app ficar utilizável.
 *
 * Segurança: recusa rodar se DATABASE_URL apontar para o banco real (overtime.db).
 * Uso: `DATABASE_URL=overtime.test.db bun run e2e/reset-db.ts`
 */
import { Database } from 'bun:sqlite';
import { existsSync, rmSync } from 'node:fs';

const DB_PATH = process.env.DATABASE_URL || 'overtime.test.db';

if (DB_PATH === 'overtime.db' || DB_PATH.endsWith('/overtime.db')) {
  throw new Error(
    `Recusando resetar o banco real (${DB_PATH}). Use um banco de teste, ex.: overtime.test.db`,
  );
}

// Remove o arquivo e artefatos WAL/SHM para garantir estado limpo.
for (const suffix of ['', '-wal', '-shm']) {
  const file = `${DB_PATH}${suffix}`;
  if (existsSync(file)) rmSync(file);
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE overtime_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('worked', 'used')),
    hours REAL,
    start_time TEXT,
    end_time TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.query('INSERT INTO projects (name) VALUES (?)').run('NTT DATA');

console.log(`✅ Banco de teste pronto em "${DB_PATH}" (projeto NTT DATA semeado).`);
db.close();
