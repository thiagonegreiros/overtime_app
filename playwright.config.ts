import { defineConfig, devices } from '@playwright/test';

/**
 * Config dos testes e2e (browser) do overtime_app.
 *
 * - Specs ficam em `e2e/` (separados do `bun test` de API em `tests/`).
 * - `webServer` reseta/semeia um banco de teste isolado (overtime.test.db) e só
 *   então sobe API (porta 3001) + frontend (porta 3000) apontando para ele. O
 *   reset roda ANTES dos servidores para a API abrir o banco já semeado.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    // Reseta/semeia o banco de teste ANTES de subir os servidores, para a API
    // abrir o arquivo já com schema. Não reusa servidor: cada run começa limpo.
    command: 'npm run db:reset:e2e && npm run dev:e2e',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
