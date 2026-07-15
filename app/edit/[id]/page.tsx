"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { OvertimeForm } from "@/components/overtime-form";
import { OvertimeEntryInput } from "@/lib/validations";
import type { Project } from "@/lib/db/schema";
import {
  getEntryById,
  updateEntry,
  fetchProjects,
  createProject,
} from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<OvertimeEntryInput | null>(
    null,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  const entryId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (!entryId || isNaN(entryId)) {
      setError("ID inválido");
      setIsLoading(false);
      return;
    }

    const loadEntry = async () => {
      try {
        setIsLoading(true);
        const [entry, projectList] = await Promise.all([
          getEntryById(entryId),
          fetchProjects(),
        ]);

        setProjects(projectList);
        setInitialData({
          projectId: entry.projectId,
          date: entry.date,
          type: entry.type,
          hours: entry.hours ?? undefined,
          startTime: entry.startTime ?? undefined,
          endTime: entry.endTime ?? undefined,
          description: entry.description ?? undefined,
        });
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar registro",
        );
        toast({
          title: "Erro",
          description:
            err instanceof Error ? err.message : "Erro ao carregar registro",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEntry();
  }, [entryId, toast]);

  const handleSubmit = async (data: OvertimeEntryInput) => {
    if (!entryId) return;

    try {
      await updateEntry(entryId, data);
      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso",
        variant: "default",
      });
      router.push("/");
    } catch (err) {
      toast({
        title: "Erro",
        description:
          err instanceof Error ? err.message : "Erro ao atualizar registro",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg text-muted-foreground">
              Carregando...
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !initialData) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button onClick={handleBack} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "Registro não encontrado"}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button onClick={handleBack} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div>
          <h1 className="text-3xl font-bold mb-2">Editar Registro</h1>
          <p className="text-muted-foreground">
            Atualize as informações do registro de horas
          </p>
        </div>

        <OvertimeForm
          onSubmit={handleSubmit}
          projects={projects}
          onCreateProject={createProject}
          initialData={initialData}
          isEditing={true}
        />
      </div>
    </main>
  );
}
