import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { overtimeEntries } from '@/lib/db/schema';
import { overtimeEntrySchema } from '@/lib/validations';
import { calculateHours } from '@/lib/utils';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(overtimeEntries.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(overtimeEntries.date, endDate));
    }
    if (type === 'worked' || type === 'used') {
      conditions.push(eq(overtimeEntries.type, type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const entries = await db
      .select()
      .from(overtimeEntries)
      .where(whereClause)
      .orderBy(desc(overtimeEntries.date))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(overtimeEntries)
      .where(whereClause);

    const allEntries = await db
      .select()
      .from(overtimeEntries);

    const totalWorked = allEntries
      .filter(e => e.type === 'worked')
      .reduce((sum, e) => sum + (e.hours || 0), 0);

    const totalUsed = allEntries
      .filter(e => e.type === 'used')
      .reduce((sum, e) => sum + (e.hours || 0), 0);

    const balance = totalWorked - totalUsed;
    const availableDays = balance / 8;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayMonth = new Date(year, month, 1);
    const lastDayMonth = new Date(year, month + 1, 0);
    const startMonth = firstDayMonth.toISOString().slice(0, 10);
    const endMonth = lastDayMonth.toISOString().slice(0, 10);
    const startYear = `${year}-01-01`;
    const endYear = `${year}-12-31`;

    const workedEntries = allEntries.filter(e => e.type === 'worked');

    const entriesCurrentMonth = workedEntries.filter(
      e => e.date >= startMonth && e.date <= endMonth
    );
    const monthDaysWithOvertime = new Set(entriesCurrentMonth.map(e => e.date)).size;
    const monthTotalHours = entriesCurrentMonth.reduce((sum, e) => sum + (e.hours || 0), 0);

    const entriesCurrentYear = workedEntries.filter(
      e => e.date >= startYear && e.date <= endYear
    );
    const yearDaysWithOvertime = new Set(entriesCurrentYear.map(e => e.date)).size;
    const yearTotalHours = entriesCurrentYear.reduce((sum, e) => sum + (e.hours || 0), 0);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      summary: {
        totalWorked,
        totalUsed,
        balance,
        availableDays: Math.round(availableDays * 100) / 100,
        monthSummary: {
          daysWithOvertime: monthDaysWithOvertime,
          totalHours: Math.round(monthTotalHours * 10) / 10,
        },
        yearSummary: {
          daysWithOvertime: yearDaysWithOvertime,
          totalHours: Math.round(yearTotalHours * 10) / 10,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching overtime entries:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar registros' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = overtimeEntrySchema.parse(body);

    let hours = validated.hours;
    if (!hours && validated.startTime && validated.endTime) {
      hours = calculateHours(validated.startTime, validated.endTime);
    }

    const [newEntry] = await db
      .insert(overtimeEntries)
      .values({
        date: validated.date,
        type: validated.type,
        hours,
        startTime: validated.startTime,
        endTime: validated.endTime,
        description: validated.description,
      })
      .returning();

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating overtime entry:', error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao criar registro' },
      { status: 500 }
    );
  }
}
