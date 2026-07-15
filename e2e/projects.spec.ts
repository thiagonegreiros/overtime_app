import { test, expect, type Page } from '@playwright/test';

/**
 * E2E da divisão por projetos.
 *
 * O banco de teste é semeado com o projeto "NTT DATA" (sem registros) pelo
 * global-setup. Cada teste que precisa de dados cria seu próprio projeto, para
 * não depender da ordem de execução (a suíte compartilha o mesmo servidor/banco).
 */

/** Abre o modal e cria um registro de horas diretas, opcionalmente num projeto novo. */
async function addWorkedHours(
  page: Page,
  opts: { hours: string; newProjectName?: string; projectName?: string },
) {
  await page.getByRole('button', { name: 'Adicionar Registro' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Seleção de projeto (o campo "Data" já vem com hoje e o tipo já é "worked").
  await dialog.getByRole('combobox').first().click();
  if (opts.newProjectName) {
    await page.getByRole('option', { name: /Novo projeto/ }).click();
    await dialog.getByPlaceholder('Nome do novo projeto').fill(opts.newProjectName);
    await dialog.getByRole('button', { name: 'Criar' }).click();
  } else if (opts.projectName) {
    await page.getByRole('option', { name: opts.projectName, exact: true }).click();
  }

  await dialog.getByLabel('Horas').fill(opts.hours);
  await dialog.getByRole('button', { name: 'Adicionar' }).click();

  await expect(page.getByText('Registro criado com sucesso')).toBeVisible();
  await expect(dialog).toBeHidden();
}

/** Troca o projeto selecionado no cabeçalho (precisa estar na aba Dashboard). */
async function selectProject(page: Page, name: string) {
  await page.getByTestId('project-selector').click();
  await page.getByRole('option', { name, exact: true }).click();
}

test('carrega o app e mostra o projeto NTT DATA no seletor', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Gerenciamento de Horas' }),
  ).toBeVisible();
  await expect(page.getByTestId('project-selector')).toContainText('NTT DATA');
});

test('registra horas num projeto novo e vê no histórico', async ({ page }) => {
  await page.goto('/');

  await addWorkedHours(page, { hours: '2', newProjectName: 'E2E Registro' });

  await selectProject(page, 'E2E Registro');
  await page.getByRole('button', { name: 'Registros' }).click();

  await expect(page.getByRole('cell', { name: 'Trabalhadas' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '2h', exact: true })).toBeVisible();
});

test('saldo é isolado por projeto', async ({ page }) => {
  await page.goto('/');

  // Lança 4h num projeto novo "E2E Alpha".
  await addWorkedHours(page, { hours: '4', newProjectName: 'E2E Alpha' });

  // No projeto Alpha o saldo é 4h.
  await selectProject(page, 'E2E Alpha');
  await expect(page.getByText('Saldo', { exact: true })).toBeVisible();
  const saldoCard = page
    .locator('div')
    .filter({ has: page.getByText('Saldo', { exact: true }) })
    .filter({ hasText: 'Disponível' })
    .last();
  await expect(saldoCard).toContainText('4h');

  // No NTT DATA (semeado, sem registros) o saldo permanece 0h — isolado.
  await selectProject(page, 'NTT DATA');
  await page.getByRole('button', { name: 'Registros' }).click();
  await expect(page.getByText('Nenhum registro encontrado')).toBeVisible();
});
