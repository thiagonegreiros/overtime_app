# Overtime App

Sistema para gerenciamento pessoal de horas extras: registrar horas trabalhadas e desfrutadas, visualizar saldo e histórico.

---

## Arquitetura do projeto

### Visão geral

- **Backend:** Elysia.js (Bun runtime) rodando na porta 3001
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript rodando na porta 3000
- **UI:** Tailwind CSS e componentes baseados em Radix UI (Button, Input, Card, Select, Table, Toast)
- **Formulários:** React Hook Form com validação Zod (`@hookform/resolvers/zod`)
- **Banco de Dados:** SQLite (`overtime.db`) com Drizzle ORM
- **Testes:** Bun Test para testes unitários e E2E

### Estrutura de pastas

```
overtime_app/
├── app/
│   ├── edit/[id]/            # Página de edição de registro
│   ├── layout.tsx             # Layout raiz, fonte Inter, Toaster
│   ├── page.tsx               # Página principal (dashboard + lista)
│   └── globals.css            # Tailwind + variáveis de tema
├── server/
│   ├── index.ts               # Servidor Elysia.js principal
│   └── routes/
│       └── overtime.ts        # Rotas da API (GET, POST, PUT, DELETE)
├── components/
│   ├── ui/                    # Componentes reutilizáveis (shadcn/ui)
│   ├── overtime-form.tsx      # Formulário de registro (criar/editar)
│   ├── overtime-list.tsx      # Tabela com filtro e paginação
│   └── overtime-summary.tsx   # Cards de resumo (dashboard)
├── lib/
│   ├── db/
│   │   ├── index.ts           # Conexão SQLite (better-sqlite3) + Drizzle
│   │   └── schema.ts          # Schema da tabela overtime_entries
│   ├── api-client.ts          # Client HTTP para comunicação com API
│   ├── utils.ts               # Funções utilitárias
│   └── validations.ts         # Schemas Zod de validação
├── tests/
│   ├── setup.ts               # Configuração de testes (DB in-memory)
│   ├── unit/                  # Testes unitários
│   │   ├── validations.test.ts
│   │   ├── utils.test.ts
│   │   └── db.test.ts
│   └── e2e/
│       └── overtime.test.ts   # Testes E2E da API
├── .env.local                 # Variáveis de ambiente
├── bunfig.toml                # Configuração do Bun Test
├── drizzle.config.ts          # Config do Drizzle
└── overtime.db                # Banco SQLite
```

### Fluxo de dados

1. O frontend (Next.js) usa o `api-client` para se comunicar com o backend Elysia.js
2. O backend valida requisições com Zod, processa lógica de negócio e interage com SQLite via Drizzle ORM
3. Endpoints da API:
   - `GET /api/overtime` - Lista registros com paginação, filtros e resumo
   - `POST /api/overtime` - Cria novo registro
   - `GET /api/overtime/:id` - Busca registro por ID
   - `PUT /api/overtime/:id` - Atualiza registro
   - `DELETE /api/overtime/:id` - Deleta registro
4. Testes automatizados garantem qualidade do código (44 testes unitários + E2E)

Banco: **SQLite** em `overtime.db`, criado/atualizado com `npm run db:push`.

---

## O que precisa para levantar o projeto

### Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **Bun** 1.0+ (para rodar o backend e testes)
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
   # ou
   bun install
   ```

3. **Criar/atualizar o banco de dados**

   O app usa SQLite com Drizzle. O arquivo `overtime.db` é criado na raiz do projeto ao rodar:

   ```bash
   npm run db:push
   ```

   Isso aplica o schema definido em `lib/db/schema.ts` (tabela `overtime_entries`). Se o arquivo já existir, o Drizzle atualiza as tabelas conforme o schema.

4. **Subir a aplicação completa (API + Frontend)**

   ```bash
   npm run dev:full
   ```

   Ou rodar separadamente:

   ```bash
   # Terminal 1 - Backend API
   npm run dev:api

   # Terminal 2 - Frontend
   npm run dev
   ```

   - **API:** http://localhost:3001
   - **Frontend:** http://localhost:3000

### Comandos úteis

| Comando            | Descrição                                    |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento (apenas frontend)|
| `npm run dev:api`  | Servidor API Elysia.js (porta 3001)         |
| `npm run dev:full` | API + Frontend simultaneamente              |
| `npm run build`    | Build de produção do Next.js                |
| `npm run start`    | Servidor de produção (após build)           |
| `npm run start:api`| API em produção                             |
| `npm run lint`     | Executa o ESLint                            |
| `npm run test`     | Executa todos os testes (Bun Test)          |
| `npm run test:watch` | Testes em modo watch                      |
| `npm run db:push`  | Sincroniza o schema com o SQLite            |
| `npm run db:studio`| Abre o Drizzle Studio no banco              |

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Esta variável define a URL da API que o frontend irá consumir.

### Testes

O projeto possui uma suíte completa de testes:

- **Testes Unitários**: Validações, funções utilitárias, operações de banco
- **Testes E2E**: Todos os endpoints da API (CRUD completo)

```bash
# Rodar todos os testes
bun test

# Modo watch (desenvolvimento)
bun test --watch
```

**Resultado esperado:** 44 testes passando ✅

### Funcionalidades

- ✅ Criar registro de horas (trabalhadas ou gozadas)
- ✅ Listar registros com paginação e filtros
- ✅ Editar registro existente (página dedicada)
- ✅ Excluir registro
- ✅ Dashboard com resumo (total trabalhado, gozado, saldo, dias disponíveis)
- ✅ Resumo mensal e anual
- ✅ Entrada de horas diretas ou por horário (entrada/saída)
- ✅ Validação de dados com Zod
- ✅ Testes automatizados (unit + E2E)

### Resumo rápido

```bash
bun install
npm run db:push
npm run dev:full
```

Depois abra:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## Tecnologias utilizadas

### Backend
- Elysia.js - Framework web rápido para Bun
- Bun - Runtime JavaScript/TypeScript
- Drizzle ORM - ORM type-safe para SQLite
- better-sqlite3 - Driver SQLite

### Frontend
- Next.js 15 - Framework React com App Router
- React 19 - Biblioteca UI
- TypeScript - Tipagem estática
- Tailwind CSS - Framework CSS utilitário
- Radix UI - Componentes acessíveis
- React Hook Form - Gerenciamento de formulários
- Zod - Validação de schemas

### Testes
- Bun Test - Test runner nativo do Bun
- Suite completa com 44 testes (unit + E2E)

---

## Estrutura de Desenvolvimento

### Modo de Desenvolvimento

Para desenvolvimento ativo, recomenda-se usar `npm run dev:full` que inicia automaticamente:
1. Backend Elysia.js com hot reload
2. Frontend Next.js com hot reload

### Produção

Para produção, considere:
1. Fazer build do frontend: `npm run build`
2. Rodar API e frontend em processos separados ou usar proxy reverso (nginx, etc)
3. Configurar `NEXT_PUBLIC_API_URL` para apontar para URL de produção da API
