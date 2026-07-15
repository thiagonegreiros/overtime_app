"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  overtimeEntrySchema,
  type OvertimeEntryInput,
} from "@/lib/validations";
import { calculateHours } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type { Project } from "@/lib/db/schema";

const NEW_PROJECT_VALUE = "__new__";

interface OvertimeFormProps {
  onSubmit: (data: OvertimeEntryInput) => Promise<void>;
  projects: Project[];
  /** Cria um novo projeto e retorna a entidade criada (com id). */
  onCreateProject: (name: string) => Promise<Project>;
  /** Projeto pré-selecionado ao criar um registro novo. */
  defaultProjectId?: number;
  initialData?: OvertimeEntryInput;
  isEditing?: boolean;
  /** Quando "modal", não envolve em Card (para uso dentro de Dialog) */
  variant?: "card" | "modal";
}

export function OvertimeForm({
  onSubmit,
  projects,
  onCreateProject,
  defaultProjectId,
  initialData,
  isEditing = false,
  variant = "card",
}: OvertimeFormProps) {
  const [inputMode, setInputMode] = useState<"hours" | "time">("hours");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<OvertimeEntryInput>({
    resolver: zodResolver(overtimeEntrySchema),
    defaultValues: initialData || {
      date: new Date().toISOString().split("T")[0],
      type: "worked",
      projectId: defaultProjectId ?? projects[0]?.id,
    },
  });

  const type = watch("type");
  const projectId = watch("projectId");

  register("projectId", { valueAsNumber: true });

  const handleProjectChange = (value: string) => {
    if (value === NEW_PROJECT_VALUE) {
      setCreatingProject(true);
      return;
    }
    setValue("projectId", Number(value), { shouldValidate: true });
  };

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    setProjectError(null);
    try {
      const project = await onCreateProject(name);
      setValue("projectId", project.id, { shouldValidate: true });
      setNewProjectName("");
      setCreatingProject(false);
    } catch (err) {
      setProjectError(
        err instanceof Error ? err.message : "Erro ao criar projeto",
      );
    }
  };

  const onFormSubmit = async (data: OvertimeEntryInput) => {
    // Garante que o campo `hours` seja preenchido quando o modo for horário de entrada/saída
    const processedData: OvertimeEntryInput = { ...data };

    if (
      (!processedData.hours || Number.isNaN(processedData.hours)) &&
      processedData.startTime &&
      processedData.endTime
    ) {
      processedData.hours = calculateHours(
        processedData.startTime,
        processedData.endTime,
      );
    }

    setIsSubmitting(true);
    try {
      await onSubmit(processedData);
      if (!isEditing) {
        reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Projeto</Label>
            {creatingProject ? (
              <div className="flex gap-2">
                <Input
                  id="project"
                  autoFocus
                  placeholder="Nome do novo projeto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateProject();
                    }
                  }}
                />
                <Button type="button" onClick={handleCreateProject}>
                  Criar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreatingProject(false);
                    setNewProjectName("");
                    setProjectError(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Select
                value={projectId ? String(projectId) : undefined}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_PROJECT_VALUE}>
                    ➕ Novo projeto…
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            {projectError && (
              <p className="text-sm text-destructive">{projectError}</p>
            )}
            {errors.projectId && (
              <p className="text-sm text-destructive">
                {errors.projectId.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setValue("type", value as "worked" | "used")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worked">Horas Trabalhadas</SelectItem>
                  <SelectItem value="used">Horas Desfrutadas</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modo de Entrada</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={inputMode === "hours" ? "default" : "outline"}
                onClick={() => {
                  setInputMode("hours");
                  // Ao trocar para modo de horas diretas, limpamos horários para evitar dados inconsistentes
                  setValue("startTime", undefined);
                  setValue("endTime", undefined);
                }}
                className="flex-1"
              >
                Horas Diretas
              </Button>
              <Button
                type="button"
                variant={inputMode === "time" ? "default" : "outline"}
                onClick={() => {
                  setInputMode("time");
                  // Ao trocar para modo de horário, limpamos o campo de horas diretas
                  setValue("hours", undefined);
                }}
                className="flex-1"
              >
                Horário Entrada/Saída
              </Button>
            </div>
          </div>

          {inputMode === "hours" ? (
            <div className="space-y-2">
              <Label htmlFor="hours">Horas</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                placeholder="Ex: 2.5"
                {...register("hours", { valueAsNumber: true })}
              />
              {errors.hours && (
                <p className="text-sm text-destructive">
                  {errors.hours.message}
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Horário de Entrada</Label>
                <Input id="startTime" type="time" {...register("startTime")} />
                {errors.startTime && (
                  <p className="text-sm text-destructive">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Horário de Saída</Label>
                <Input id="endTime" type="time" {...register("endTime")} />
                {errors.endTime && (
                  <p className="text-sm text-destructive">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Projeto urgente, reunião extra..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Atualizar"
                : "Adicionar"}
          </Button>
        </form>
  );

  if (variant === "modal") {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {isEditing ? "Editar Registro" : "Adicionar Registro"}
        </CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
