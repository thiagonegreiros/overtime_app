"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHours } from "@/lib/utils";
import { Clock, TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface OvertimeSummaryProps {
  totalWorked: number;
  totalUsed: number;
  balance: number;
  availableDays: number;
}

export function OvertimeSummary({
  totalWorked,
  totalUsed,
  balance,
  availableDays,
}: OvertimeSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Trabalhado
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
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
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHours(totalUsed)}</div>
          <p className="text-xs text-muted-foreground">Horas já utilizadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
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
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {availableDays.toFixed(2)} dias
          </div>
          <p className="text-xs text-muted-foreground">Baseado em 8h/dia</p>
        </CardContent>
      </Card>
    </div>
  );
}
