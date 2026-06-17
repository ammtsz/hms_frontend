"use client";

import React from "react";
import { Pencil, Save, X } from "lucide-react";
import type { Priority } from "@/types/types";
import type { SystemOption } from "@/types/systemOptions";
import {
  Badge,
  Button,
  Checkbox,
  IconButton,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableMobileLabel,
  TableRow,
  stackedTableClasses,
} from "@/components/ui";
import {
  PRIORITY_1_TOOLTIP,
  PRIORITY_1_VALUE,
  getPriorityLabel,
  usePriorityManagementList,
} from "@/features/settings/system/hooks/usePriorityManagementList";

export default function PriorityManagementList() {
  const {
    isAdmin,
    priorities,
    isLoading,
    error,
    activePriorities,
    editingId,
    setEditingId,
    editingLabel,
    setEditingLabel,
    deactivationOptionId,
    blockingPatients,
    selectedPatientIds,
    setSelectedPatientIds,
    targetPriority,
    setTargetPriority,
    updatePriorityOption,
    deactivatePriorityOption,
    bulkUpdatePatientsPriority,
    closeDeactivationFlow,
    handleToggleDeactivate,
    handleSaveLabel,
    togglePatientSelected,
    confirmBulkReassignAndTryDeactivate,
  } = usePriorityManagementList();

  if (isLoading) {
    return <div className="text-center py-6 text-gray-500">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">Erro ao carregar prioridades.</div>
    );
  }

  return (
    <div className="space-y-4">
      <TableContainer className="[&>div]:overflow-visible md:[&>div]:overflow-x-auto">
        <Table className={stackedTableClasses.table}>
          <TableHeader className={stackedTableClasses.header}>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Rótulo</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="hidden w-32 md:table-cell">Uso</TableHead>
              <TableHead align="center" className="w-28">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={stackedTableClasses.body}>
            {(priorities ?? []).map((option: SystemOption) => {
              const isEditing = editingId === option.id;
              const label = getPriorityLabel(option);
              return (
                <TableRow key={option.id} className={stackedTableClasses.row}>
                  <TableCell className={stackedTableClasses.cell}>
                    <TableMobileLabel>Código</TableMobileLabel>
                    {option.value}
                  </TableCell>

                  <TableCell className={stackedTableClasses.cell}>
                    <TableMobileLabel>Rótulo</TableMobileLabel>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          className="min-h-[36px] py-1"
                          maxLength={50}
                        />
                      </div>
                    ) : (
                      <span className={!option.isActive ? "text-gray-400" : ""}>
                        {label}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className={stackedTableClasses.cell}>
                    <TableMobileLabel>Status</TableMobileLabel>
                    {isEditing ? (
                      option.value === PRIORITY_1_VALUE ? (
                        <Badge
                          variant={option.isActive ? "success" : "neutral"}
                          title={PRIORITY_1_TOOLTIP}
                        >
                          ● Ativo
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleToggleDeactivate(option)}
                          disabled={
                            deactivatePriorityOption.isPending ||
                            updatePriorityOption.isPending
                          }
                          className={`rounded-full ${
                            option.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                          }`}
                          title={
                            option.isActive
                              ? "Desativar prioridade"
                              : "Ativar prioridade"
                          }
                        >
                          {option.isActive ? "● Ativo" : "○ Inativo"}
                        </Button>
                      )
                    ) : (
                      <Badge
                        variant={option.isActive ? "success" : "neutral"}
                        title={
                          option.value === PRIORITY_1_VALUE
                            ? PRIORITY_1_TOOLTIP
                            : undefined
                        }
                      >
                        {option.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell
                    className={`${stackedTableClasses.cell} hidden md:table-cell`}
                  >
                    <TableMobileLabel>Uso</TableMobileLabel>
                    {typeof option.usageCount === "number" &&
                    option.usageCount > 0
                      ? `${option.usageCount} paciente(s)`
                      : "-"}
                  </TableCell>

                  <TableCell
                    align="center"
                    className={`${stackedTableClasses.actionsCell} md:text-center`}
                  >
                    <TableMobileLabel>Ação</TableMobileLabel>
                    {isEditing ? (
                      <div className="flex gap-2 justify-center">
                        <IconButton
                          onClick={() => handleSaveLabel(option)}
                          disabled={updatePriorityOption.isPending}
                          tone="success"
                          title="Salvar"
                        >
                          <Save className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setEditingId(null);
                            setEditingLabel("");
                          }}
                          disabled={updatePriorityOption.isPending}
                          tone="neutral"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      </div>
                    ) : (
                      <IconButton
                        onClick={() => {
                          if (!isAdmin) return;
                          setEditingId(option.id);
                          setEditingLabel(label);
                        }}
                        disabled={!isAdmin}
                        tone="primary"
                        title={isAdmin ? "Editar rótulo" : "Apenas admin"}
                      >
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {deactivationOptionId && blockingPatients.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-900">
            Reatribuição necessária antes de desativar
          </h3>
          <p className="text-sm text-amber-800">
            Não é possível desativar a prioridade {deactivationOptionId} porque
            existem{" "}
            <span className="font-semibold">{blockingPatients.length}</span>{" "}
            pacientes usando este nível. Selecione os pacientes e escolha para
            qual prioridade ativa eles devem ser movidos.
          </p>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Pacientes usando a prioridade
              </label>

              <div className="max-h-64 overflow-auto border border-amber-200 bg-white rounded-md">
                {blockingPatients.length === 0 ? (
                  <div className="p-3 text-sm text-gray-600">
                    Nenhum paciente encontrado.
                  </div>
                ) : (
                  blockingPatients.map((p) => {
                    const checked = selectedPatientIds.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={checked}
                          onChange={() => togglePatientSelected(p.id)}
                        />
                        <span className="text-sm text-gray-800">
                          {p.name}{" "}
                          <span className="text-xs text-gray-500">
                            ({p.priority})
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedPatientIds(
                      new Set(blockingPatients.map((bp) => bp.id)),
                    )
                  }
                  className="border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Selecionar todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatientIds(new Set())}
                  className="border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Limpar seleção
                </Button>
              </div>
            </div>

            <div className="w-full md:w-80">
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Prioridade reatribuída (ativa)
              </label>
              <Select
                value={targetPriority}
                onChange={(e) => setTargetPriority(e.target.value as Priority)}
                className="border-amber-200"
                disabled={activePriorities.length <= 1}
              >
                {activePriorities
                  .filter((p) => {
                    const deactivated = (priorities ?? []).find(
                      (x) => x.id === deactivationOptionId,
                    );
                    const deactivatedCode = deactivated?.value;
                    return p.value !== deactivatedCode;
                  })
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((p) => (
                    <option key={p.id} value={p.value as Priority}>
                      {p.label || p.value}
                    </option>
                  ))}
              </Select>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={confirmBulkReassignAndTryDeactivate}
                  disabled={
                    bulkUpdatePatientsPriority.isPending ||
                    deactivatePriorityOption.isPending
                  }
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Reatribuir
                  {selectedPatientIds.size === blockingPatients.length
                    ? " e desativar"
                    : ""}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeDeactivationFlow}
                  className="border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
