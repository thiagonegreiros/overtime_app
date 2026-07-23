"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { BarChart3 } from "lucide-react";
import {
  fetchMonthlyReport,
  type MonthlyReportEntry,
} from "@/lib/api-client";

interface OvertimeReportProps {
  projectId: number | null;
  projectName?: string;
}

/** Converte `YYYY-MM` no rótulo curto pt-BR (ex.: "jul/2026"), sem fuso. */
function monthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon) return month;
  const date = new Date(year, mon - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

/** Soma `delta` meses a um `YYYY-MM` e devolve outro `YYYY-MM`. */
function addMonths(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const total = year * 12 + (mon - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMon = (total % 12) + 1;
  return `${newYear}-${String(newMon).padStart(2, "0")}`;
}

function monthIndex(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return year * 12 + (mon - 1);
}

/** Mês corrente no formato `YYYY-MM`. */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MAX_SPAN = 11; // 12 meses inclusive (start..start+11)

export function OvertimeReport({ projectId, projectName }: OvertimeReportProps) {
  const end0 = currentMonth();
  const [startMonth, setStartMonth] = useState(() => addMonths(end0, -MAX_SPAN));
  const [endMonth, setEndMonth] = useState(end0);
  const [data, setData] = useState<MonthlyReportEntry[]>([]);
  const [totals, setTotals] = useState({ totalHours: 0, totalDays: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartChange = (value: string) => {
    if (!value) return;
    let nextStart = value;
    let nextEnd = endMonth;
    if (monthIndex(nextStart) > monthIndex(nextEnd)) {
      nextEnd = nextStart;
    } else if (monthIndex(nextEnd) - monthIndex(nextStart) > MAX_SPAN) {
      // Mantém o período dentro de 1 ano ajustando o mês final.
      nextEnd = addMonths(nextStart, MAX_SPAN);
      toast({
        title: "Período ajustado",
        description: "O relatório cobre no máximo 12 meses.",
      });
    }
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
  };

  const handleEndChange = (value: string) => {
    if (!value) return;
    let nextEnd = value;
    let nextStart = startMonth;
    if (monthIndex(nextEnd) < monthIndex(nextStart)) {
      nextStart = nextEnd;
    } else if (monthIndex(nextEnd) - monthIndex(nextStart) > MAX_SPAN) {
      nextStart = addMonths(nextEnd, -MAX_SPAN);
      toast({
        title: "Período ajustado",
        description: "O relatório cobre no máximo 12 meses.",
      });
    }
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
  };

  const loadReport = useCallback(async () => {
    if (projectId === null) return;
    try {
      setIsLoading(true);
      const res = await fetchMonthlyReport({ projectId, startMonth, endMonth });
      setData(res.data);
      setTotals(res.totals);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, startMonth, endMonth, toast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const chartData = data.map((d) => ({ ...d, label: monthLabel(d.month) }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório de horas trabalhadas
            {projectName ? (
              <span className="text-muted-foreground font-normal">
                — {projectName}
              </span>
            ) : null}
          </CardTitle>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="report-start" className="text-xs">
                De
              </Label>
              <input
                id="report-start"
                type="month"
                value={startMonth}
                onChange={(e) => handleStartChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="report-end" className="text-xs">
                Até
              </Label>
              <input
                id="report-end"
                type="month"
                value={endMonth}
                min={startMonth}
                max={addMonths(startMonth, MAX_SPAN)}
                onChange={(e) => handleEndChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {projectId === null ? (
          <p className="py-8 text-center text-muted-foreground">
            Selecione um projeto para ver o relatório.
          </p>
        ) : isLoading ? (
          <p className="py-8 text-center text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <div>
                  <span className="text-2xl font-bold">{totals.totalHours}h</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    no período
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {totals.totalDays}{" "}
                  {totals.totalDays === 1 ? "dia" : "dias"} com horas extras
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}h`, "Horas"]}
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    />
                    <Bar
                      dataKey="totalHours"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      name="Horas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Dias com horas</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d) => (
                    <TableRow key={d.month}>
                      <TableCell className="font-medium capitalize">
                        {monthLabel(d.month)}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.daysWithOvertime}
                      </TableCell>
                      <TableCell className="text-right">{d.totalHours}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold">
                      {totals.totalDays}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {totals.totalHours}h
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
