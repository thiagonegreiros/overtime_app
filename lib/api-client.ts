import { OvertimeEntry } from './db/schema';
import { OvertimeEntryInput } from './validations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse {
  entries: OvertimeEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalWorked: number;
    totalUsed: number;
    balance: number;
    availableDays: number;
    monthSummary?: { daysWithOvertime: number; totalHours: number };
    yearSummary?: { daysWithOvertime: number; totalHours: number };
  };
}

export interface FetchEntriesParams {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export async function fetchEntries(params: FetchEntriesParams = {}): Promise<ApiResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.type && params.type !== 'all') searchParams.append('type', params.type);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);

  const response = await fetch(`${API_URL}/api/overtime?${searchParams}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar registros');
  }

  return response.json();
}

export async function createEntry(data: OvertimeEntryInput): Promise<OvertimeEntry> {
  const response = await fetch(`${API_URL}/api/overtime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro ao criar registro');
  }

  return response.json();
}

export async function getEntryById(id: number): Promise<OvertimeEntry> {
  const response = await fetch(`${API_URL}/api/overtime/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Registro não encontrado');
    }
    throw new Error('Erro ao buscar registro');
  }

  return response.json();
}

export async function updateEntry(id: number, data: OvertimeEntryInput): Promise<OvertimeEntry> {
  const response = await fetch(`${API_URL}/api/overtime/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Registro não encontrado');
    }
    throw new Error('Erro ao atualizar registro');
  }

  return response.json();
}

export async function deleteEntry(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/overtime/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Registro não encontrado');
    }
    throw new Error('Erro ao deletar registro');
  }
}
