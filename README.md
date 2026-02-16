# Overtime App

Sistema para gerenciamento pessoal de horas extras: registrar horas trabalhadas e desfrutadas, visualizar saldo e histórico.

---

## Arquitetura do projeto

### Visão geral

- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript.
- **UI:** Tailwind CSS e componentes baseados em Radix UI (Button, Input, Card, Select, Table, Toast).
- **Formulários:** React Hook Form com validação Zod (`@hookform/resolvers/zod`).
- **Dados:** API Routes do próprio Next.js (`/api/overtime`) que leem e gravam em SQLite via Drizzle ORM. Não há backend separado.

### Estrutura de pastas

```
overtime_app/
├── app/
│   ├── api/overtime/          # GET (lista + resumo), POST (criar)
│   ├── api/overtime/[id]/     # PUT (editar), DELETE (excluir)
│   ├── layout.tsx             # Layout raiz, fonte Inter, Toaster
│   ├── page.tsx               # Página principal (lista, formulário, resumo)
│   └── globals.css            # Tailwind + variáveis de tema (cores, radius)
├── components/
│   ├── ui/                    # Componentes reutilizáveis (button, input, card, select, table, toast)
│   ├── overtime-form.tsx      # Formulário de registro (horas ou entrada/saída)
│   ├── overtime-list.tsx      # Tabela com filtro e paginação
│   └── overtime-summary.tsx    # Cards: total trabalhado, desfrutado, saldo, dias disponíveis
├── lib/
│   ├── db/
│   │   ├── index.ts           # Conexão SQLite (better-sqlite3) + Drizzle
│   │   └── schema.ts          # Tabela overtime_entries
│   ├── utils.ts               # cn(), calculateHours(), formatHours(), etc.
│   └── validations.ts         # Schema Zod do registro (overtimeEntrySchema)
├── drizzle.config.ts          # Config do Drizzle (schema, sqlite, url do DB)
└── overtime.db                 # Banco SQLite (gerado ao rodar db:push)
```

### Fluxo de dados

1. A página (`app/page.tsx`) chama `GET /api/overtime?page=&limit=&type=` para listar registros e obter o resumo (totais, saldo, dias disponíveis).
2. O usuário cadastra um registro pelo formulário; o submit envia `POST /api/overtime` com body validado por Zod.
3. A API valida o body, calcula `hours` quando há apenas entrada/saída, persiste no SQLite e devolve o registro criado.
4. Após sucesso (criar ou excluir), a página recarrega os dados com um novo `GET`.

Banco: **SQLite** em `overtime.db`, criado/atualizado com `npm run db:push`.

---

## O que precisa para levantar o projeto

### Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **NPM** (gerenciador de pacotes do projeto)

### Passo a passo

1. **Clonar e entrar na pasta do projeto**

   ```bash
   git clone https://github.com/thiagonegreiros/overtime_app
   cd overtime_app
   ```

2. **Instalar dependências**

   ```bash
   npm install
   ```

3. **Criar/atualizar o banco de dados**

   O app usa SQLite com Drizzle. O arquivo `overtime.db` é criado na raiz do projeto ao rodar:

   ```bash
   npm db:push
   ```

   Isso aplica o schema definido em `lib/db/schema.ts` (tabela `overtime_entries`). Se o arquivo já existir, o Drizzle atualiza as tabelas conforme o schema.

4. **Subir a aplicação**

   ```bash
   npm dev
   ```

   Acesse **http://localhost:3000**. A única rota de interface é a raiz (`/`), onde ficam o resumo, o formulário de cadastro e a lista com filtro e paginação.

### Comandos úteis

| Comando         | Descrição                         |
| --------------- | --------------------------------- |
| `npm dev`       | Servidor de desenvolvimento       |
| `npm build`     | Build de produção                 |
| `npm start`     | Servidor de produção (após build) |
| `npm lint`      | Executa o ESLint                  |
| `npm db:push`   | Sincroniza o schema com o SQLite  |
| `npm db:studio` | Abre o Drizzle Studio no banco    |

### Variáveis de ambiente

Não há variáveis de ambiente obrigatórias. O banco é o arquivo `overtime.db` na raiz (configurado em `drizzle.config.ts` e `lib/db/index.ts`). Para trocar o caminho do banco no futuro, basta ajustar a URL em `drizzle.config.ts` e o path em `lib/db/index.ts`.

### Resumo rápido

```bash
npm install
npm db:push
npm dev
```

Depois abra http://localhost:3000 no navegador.
