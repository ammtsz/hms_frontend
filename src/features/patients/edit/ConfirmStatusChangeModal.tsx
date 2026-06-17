import React from "react";
import BaseModal from "@/components/common/BaseModal";
import type { PendingStatusChange } from "@/features/patients/form/hooks/useEditPatientForm";
import { Button } from "@/components/ui";

interface ConfirmStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingStatusChange: PendingStatusChange | null;
  isSaving: boolean;
}

const STATUS_LABELS: Record<"A" | "F", string> = {
  A: "Alta do tratamento",
  F: "Faltas Consecutivas",
};

const ConfirmStatusChangeModal: React.FC<ConfirmStatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pendingStatusChange,
  isSaving,
}) => {
  if (!pendingStatusChange) return null;

  const label = STATUS_LABELS[pendingStatusChange.newStatus];
  const { openCount } = pendingStatusChange;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirmar alteração para ${label}`}
      maxWidth="md"
    >
      <div className="p-6">
        <p className="text-gray-700 mb-4">
          Ao alterar para <strong>{label}</strong>, todos os atendimentos em
          aberto (agendados, check-in ou em andamento) serão cancelados.
        </p>
        <p className="text-gray-700 mb-4">
          Este paciente possui <strong>{openCount}</strong>{" "}
          {openCount === 1 ? "atendimento" : "atendimentos"} em aberto que{" "}
          {openCount === 1 ? "será cancelado" : "serão cancelados"}.
        </p>
        <p className="text-gray-700 mb-6">Deseja continuar com esta ação?</p>
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isSaving}
            loadingText="Salvando..."
            disabled={isSaving}
          >
            Sim, alterar status
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmStatusChangeModal;
