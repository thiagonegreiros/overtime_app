import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import { projects } from '../../lib/db/schema';
import { projectSchema } from '../../lib/validations';
import { asc, sql } from 'drizzle-orm';

export const projectRoutes = new Elysia({ prefix: '/api/projects' })
  .get('/', async () => {
    try {
      return await db.select().from(projects).orderBy(asc(projects.name));
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Erro ao buscar projetos');
    }
  })
  .post('/', async ({ body, set }) => {
    try {
      const { name } = projectSchema.parse(body);

      // Nome é único (case-insensitive): bloqueia duplicatas como "NTT DATA" / "ntt data".
      const [existing] = await db
        .select()
        .from(projects)
        .where(sql`lower(${projects.name}) = lower(${name})`);

      if (existing) {
        set.status = 409;
        throw new Error('Já existe um projeto com esse nome');
      }

      const [newProject] = await db
        .insert(projects)
        .values({ name })
        .returning();

      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        set.status = 400;
        throw new Error('Dados inválidos');
      }
      throw error;
    }
  });
