"use client";

import { useState, useEffect, useCallback } from "react";
import { OvertimeForm } from "@/components/overtime-form";
import { OvertimeList } from "@/components/overtime-list";
import { OvertimeSummary } from "@/components/overtime-summary";
import { OvertimeEntry } from "@/lib/db/schema";
import { OvertimeEntryInput } from "@/lib/validations";
import { useToast } from "@/components/ui/use-toast";

interface ApiResponse {
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
  };
}

export default function Home() {
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [summary, setSummary] = useState({
    totalWorked: 0,
    totalUsed: 0,
    balance: 0,
    availableDays: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/overtime?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar registros");

      const data: ApiResponse = await response.json();
      setEntries(data.entries);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (_error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, typeFilter, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (data: OvertimeEntryInput) => {
    try {
      const response = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erro ao criar registro");

      toast({
        title: "Sucesso",
        description: "Registro criado com sucesso",
      });

      fetchEntries();
    } catch (_error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (_entry: OvertimeEntry) => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de edição em breve",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
      const response = await fetch(`/api/overtime/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar registro");

      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso",
      });

      fetchEntries();
    } catch (_error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, limit: size, page: 1 }));
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Gerenciamento de Horas Extras
          </h1>
          <p className="text-muted-foreground">
            Controle suas horas extras trabalhadas e desfrutadas
          </p>
        </div>

        <OvertimeSummary
          totalWorked={summary.totalWorked}
          totalUsed={summary.totalUsed}
          balance={summary.balance}
          availableDays={summary.availableDays}
        />

        <OvertimeForm onSubmit={handleSubmit} />

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <OvertimeList
            entries={entries}
            onEdit={handleEdit}
            onDelete={handleDelete}
            totalCount={pagination.total}
            currentPage={pagination.page}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onTypeFilter={handleTypeFilter}
            typeFilter={typeFilter}
          />
        )}
      </div>
    </main>
  );
}
