import { useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { UserRole } from "@/types/auth";
import type { Priority } from "@/types/types";
import type {
  BlockingPriorityPatient,
  DeactivatePriorityResponse,
} from "@/api/settings/priorities";
import {
  useBulkUpdatePatientsPriority,
  useDeactivatePriorityOption,
  usePriorities,
  useUpdatePriorityOption,
} from "@/api/query/hooks/usePriorityOptionsQueries";
import type { SystemOption } from "@/types/systemOptions";

export const PRIORITY_1_VALUE: Priority = "1";
export const PRIORITY_1_TOOLTIP =
  "A prioridade 1 é usada como padrão pelo sistema e não pode ser desativada.";

export function getPriorityLabel(option: SystemOption): string {
  return option.label || option.value;
}

export function usePriorityManagementList() {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const isAdmin = user?.role === UserRole.ADMIN;

  const { data: priorities, isLoading, error, refetch } = usePriorities(true);

  const activePriorities = useMemo(
    () => (priorities ?? []).filter((p) => p.isActive),
    [priorities],
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const [deactivationOptionId, setDeactivationOptionId] = useState<
    number | null
  >(null);
  const [blockingPatients, setBlockingPatients] = useState<
    BlockingPriorityPatient[]
  >([]);
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<number>>(
    new Set(),
  );
  const [targetPriority, setTargetPriority] = useState<Priority>("1");

  const updatePriorityOption = useUpdatePriorityOption();
  const deactivatePriorityOption = useDeactivatePriorityOption();
  const bulkUpdatePatientsPriority = useBulkUpdatePatientsPriority();

  const openDeactivationFlow = async (
    option: SystemOption,
  ): Promise<DeactivatePriorityResponse> => {
    const res = await deactivatePriorityOption.mutateAsync(option.id);

    if (res.success) {
      showToast("Prioridade atualizada com sucesso.", "success");
      return res;
    }

    showToast(
      res.error || "Não é possível desativar esta prioridade.",
      "error",
    );

    const nextBlockingPatients = res.blockingPatients ?? [];
    if (nextBlockingPatients.length === 0) return res;

    setDeactivationOptionId(option.id);
    setBlockingPatients(nextBlockingPatients);

    setSelectedPatientIds(new Set(nextBlockingPatients.map((p) => p.id)));

    const refetchResult = await refetch();
    const refreshedPriorities = (refetchResult.data ??
      priorities ??
      []) as SystemOption[];
    const refreshedActivePriorities = refreshedPriorities.filter(
      (p) => p.isActive,
    );

    const deactivatedPriorityCode = option.value as Priority;
    const candidateTargets = refreshedActivePriorities
      .filter((p) => p.value !== deactivatedPriorityCode)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const fallbackPriority = (refreshedActivePriorities.find(
      (p) => p.value !== deactivatedPriorityCode,
    )?.value ??
      refreshedActivePriorities[0]?.value ??
      "1") as Priority;

    setTargetPriority(
      (candidateTargets[0]?.value ?? fallbackPriority) as Priority,
    );

    return res;
  };

  const closeDeactivationFlow = () => {
    setDeactivationOptionId(null);
    setBlockingPatients([]);
    setSelectedPatientIds(new Set());
  };

  const handleToggleDeactivate = async (option: SystemOption) => {
    if (!isAdmin) return;

    if (!option.isActive) {
      const result = await updatePriorityOption.mutateAsync({
        id: option.id,
        updates: {
          isActive: true,
        },
      });

      if (result) {
        showToast("Prioridade ativada com sucesso.", "success");
      }
      return;
    }

    if (option.value === "1") {
      showToast("A prioridade 1 não pode ser desativada.", "error");
      return;
    }

    await openDeactivationFlow(option);
  };

  const handleSaveLabel = async (option: SystemOption) => {
    if (!isAdmin) return;

    const trimmed = editingLabel.trim();
    if (!trimmed) {
      showToast("Informe um rótulo para a prioridade.", "error");
      return;
    }
    if (trimmed.length > 50) {
      showToast("Rótulo deve ter no máximo 50 caracteres.", "error");
      return;
    }

    await updatePriorityOption.mutateAsync({
      id: option.id,
      updates: {
        label: trimmed,
      },
    });

    setEditingId(null);
    setEditingLabel("");
    showToast("Rótulo da prioridade atualizado.", "success");
  };

  const togglePatientSelected = (patientId: number) => {
    setSelectedPatientIds((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  };

  const confirmBulkReassignAndTryDeactivate = async () => {
    if (!deactivationOptionId) return;

    const nextPatientIds = [...selectedPatientIds];
    if (nextPatientIds.length === 0) {
      showToast("Selecione ao menos um paciente.", "error");
      return;
    }

    await bulkUpdatePatientsPriority.mutateAsync({
      patientIds: nextPatientIds,
      priority: targetPriority,
    });

    const option = (priorities ?? []).find(
      (p) => p.id === deactivationOptionId,
    );
    if (!option) return;

    const res = await deactivatePriorityOption.mutateAsync(option.id);
    if (res.success) {
      closeDeactivationFlow();
      showToast("Prioridade desativada com sucesso.", "success");
      return;
    }

    setBlockingPatients(res.blockingPatients ?? []);
    setSelectedPatientIds(
      new Set((res.blockingPatients ?? []).map((p) => p.id)),
    );

    if(!res.blockingPatients) {
      showToast(
        res.error || "Não é possível desativar esta prioridade.",
        "error",
      );
    } else {
      showToast(
        "Ainda existem pacientes usando esta prioridade. Refaça a reatribuição.",
        "error",
      );
    }
    
    refetch();
  };

  return {
    isAdmin,
    priorities,
    isLoading,
    error,
    refetch,
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
  };
}
