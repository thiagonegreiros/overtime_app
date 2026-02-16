import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { overtimeEntries } from '@/lib/db/schema';
import { overtimeEntrySchema } from '@/lib/validations';
import { calculateHours } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = overtimeEntrySchema.parse(body);

    let hours = validated.hours;
    if (!hours && validated.startTime && validated.endTime) {
      hours = calculateHours(validated.startTime, validated.endTime);
    }

    const [updatedEntry] = await db
      .update(overtimeEntries)
      .set({
        date: validated.date,
        type: validated.type,
        hours,
        startTime: validated.startTime,
        endTime: validated.endTime,
        description: validated.description,
      })
      .where(eq(overtimeEntries.id, id))
      .returning();

    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error updating overtime entry:', error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar registro' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const [deletedEntry] = await db
      .delete(overtimeEntries)
      .where(eq(overtimeEntries.id, id))
      .returning();

    if (!deletedEntry) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting overtime entry:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar registro' },
      { status: 500 }
    );
  }
}
