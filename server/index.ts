import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { overtimeRoutes } from './routes/overtime';
import { projectRoutes } from './routes/projects';

const PORT = process.env.PORT || 3001;

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(projectRoutes)
  .use(overtimeRoutes)
  .listen(PORT);

console.log(`🦊 Elysia API is running at http://${app.server?.hostname}:${app.server?.port}`);

export default app;
