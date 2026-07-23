import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return (endMinutes - startMinutes) / 60;
}

export function calculateAvailableDays(totalHours: number): number {
  return totalHours / 8;
}

export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}min`;
}

export function calculateBalance(worked: number, used: number): number {
  return worked - used;
}

/**
 * Lista os meses (formato `YYYY-MM`) de `startMonth` até `endMonth`, inclusive.
 * Ambos os argumentos são `YYYY-MM`. Retorna vazio se o range for inválido
 * (start depois de end).
 */
export function listMonths(startMonth: string, endMonth: string): string[] {
  const [startYear, startMon] = startMonth.split("-").map(Number);
  const [endYear, endMon] = endMonth.split("-").map(Number);

  if (
    !startYear || !startMon || !endYear || !endMon ||
    startYear * 12 + startMon > endYear * 12 + endMon
  ) {
    return [];
  }

  const months: string[] = [];
  let year = startYear;
  let mon = startMon;
  while (year * 12 + mon <= endYear * 12 + endMon) {
    months.push(`${year}-${String(mon).padStart(2, "0")}`);
    mon += 1;
    if (mon > 12) {
      mon = 1;
      year += 1;
    }
  }
  return months;
}
