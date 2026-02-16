"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHours } from "@/lib/utils";
import { Clock, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthYearSummary {
  daysWithOvertime: number;
  totalHours: number;
}

interface OvertimeSummaryProps {
  totalWorked: number;
  totalUsed: number;
  balance: number;
  availableDays: number;
  monthSummary?: MonthYearSummary;
  yearSummary?: MonthYearSummary;
}

function IconCircle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        className
      )}
    >
      {children}
    </div>
  );
}

function SummaryCard({
  title,
  bgColor,
  rows,
}: {
  title: string;
  bgColor: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-5 text-white shadow-md",
        bgColor
      )}
    >
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-2">
        {rows.slice(0, -1).map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="opacity-95">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
        {rows.length > 1 && <hr className="border-white/30 my-3" />}
        {rows.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="opacity-95">{rows[rows.length - 1].label}</span>
            <span className="font-medium">{rows[rows.length - 1].value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function OvertimeSummary({
  totalWorked,
  totalUsed,
  balance,
  availableDays,
  monthSummary = { daysWithOvertime: 0, totalHours: 0 },
  yearSummary = { daysWithOvertime: 0, totalHours: 0 },
}: OvertimeSummaryProps) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const yearLabel = now.getFullYear().toString();

  return (
    <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Trabalhado
          </CardTitle>
          <IconCircle className="bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </IconCircle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHours(totalWorked)}</div>
          <p className="text-xs text-muted-foreground">
            Horas extras acumuladas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Desfrutadas
          </CardTitle>
          <IconCircle className="bg-orange-100">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </IconCircle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHours(totalUsed)}</div>
          <p className="text-xs text-muted-foreground">Horas já utilizadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          <IconCircle className="bg-green-100">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </IconCircle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatHours(Math.abs(balance))}
          </div>
          <p className="text-xs text-muted-foreground">
            {balance >= 0 ? "Disponível" : "Negativo"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Dias Disponíveis
          </CardTitle>
          <IconCircle className="bg-violet-100">
            <Calendar className="h-5 w-5 text-violet-600" />
          </IconCircle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {availableDays.toFixed(2)} dias
          </div>
          <p className="text-xs text-muted-foreground">Baseado em 8h/dia</p>
        </CardContent>
      </Card>
    </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          title={`Resumo de horas no mês corrente (${monthLabel})`}
          bgColor="bg-blue-600"
          rows={[
            {
              label: "Dias com horas extras:",
              value: `${monthSummary.daysWithOvertime} ${monthSummary.daysWithOvertime === 1 ? "dia" : "dias"}`,
            },
            {
              label: "Total de horas no mês:",
              value: `${monthSummary.totalHours}h`,
            },
          ]}
        />
        <SummaryCard
          title={`Resumo total por ano (${yearLabel})`}
          bgColor="bg-orange-500"
          rows={[
            {
              label: "Horas feitas no ano:",
              value: `${yearSummary.totalHours}h`,
            },
            {
              label: "Dias com horas extras no ano:",
              value: `${yearSummary.daysWithOvertime} ${yearSummary.daysWithOvertime === 1 ? "dia" : "dias"}`,
            },
          ]}
        />
      </div>
    </div>
  );
}
