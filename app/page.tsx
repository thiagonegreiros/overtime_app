"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OvertimeForm } from "@/components/overtime-form";
import { OvertimeList } from "@/components/overtime-list";
import { OvertimeSummary } from "@/components/overtime-summary";
import { OvertimeEntry } from "@/lib/db/schema";
import { OvertimeEntryInput } from "@/lib/validations";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LayoutDashboard, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchEntries, createEntry, deleteEntry } from "@/lib/api-client";

type Tab = "dashboard" | "registros";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [summary, setSummary] = useState({
    totalWorked: 0,
    totalUsed: 0,
    balance: 0,
    availableDays: 0,
    monthSummary: { daysWithOvertime: 0, totalHours: 0 },
    yearSummary: { daysWithOvertime: 0, totalHours: 0 },
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

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchEntries({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter,
      });

      setEntries(data.entries);
      setPagination(data.pagination);
      setSummary({
        ...data.summary,
        monthSummary: data.summary.monthSummary ?? {
          daysWithOvertime: 0,
          totalHours: 0,
        },
        yearSummary: data.summary.yearSummary ?? {
          daysWithOvertime: 0,
          totalHours: 0,
        },
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os registros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, typeFilter, toast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (data: OvertimeEntryInput) => {
    try {
      await createEntry(data);
      toast({
        title: "Sucesso",
        description: "Registro criado com sucesso",
      });

      setModalOpen(false);
      loadEntries();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o registro",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: OvertimeEntry) => {
    router.push(`/edit/${entry.id}`);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId === null) return;

    try {
      await deleteEntry(deleteConfirmId);
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso",
      });

      setDeleteConfirmId(null);
      loadEntries();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o registro",
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciamento de Horas</h1>
            <p className="text-muted-foreground">
              Controle suas horas trabalhadas e horas extras
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            Adicionar Registro
          </Button>
        </div>

        <div className="flex gap-2 p-1 rounded-lg bg-muted/50 w-fit">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("dashboard")}
            className={cn("gap-2", activeTab === "dashboard" && "shadow-sm")}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "registros" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("registros")}
            className={cn("gap-2", activeTab === "registros" && "shadow-sm")}
          >
            <List className="h-4 w-4" />
            Registros
          </Button>
        </div>

        {activeTab === "dashboard" && (
          <OvertimeSummary
            totalWorked={summary.totalWorked}
            totalUsed={summary.totalUsed}
            balance={summary.balance}
            availableDays={summary.availableDays}
            monthSummary={summary.monthSummary}
            yearSummary={summary.yearSummary}
          />
        )}

        {activeTab === "registros" && (
          <>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : (
              <OvertimeList
                entries={entries}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                totalCount={pagination.total}
                currentPage={pagination.page}
                pageSize={pagination.limit}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onTypeFilter={handleTypeFilter}
                typeFilter={typeFilter}
              />
            )}
          </>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Registro de Horas</DialogTitle>
          </DialogHeader>
          <OvertimeForm onSubmit={handleSubmit} variant="modal" />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent showClose={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
