import React from "react";
import {
  useAssessmentBeforeTreatmentConfirmModal,
  useCloseModal,
} from "@/stores/modalStore";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";

/**
 * Confirmation modal for Rule 1: moving assessment to onGoing when the patient
 * has not yet completed physiotherapy/tens. Asks user to confirm they want to continue.
 */
export const AssessmentBeforeTreatmentConfirmModal: React.FC = () => {
  const modal = useAssessmentBeforeTreatmentConfirmModal();
  const closeModal = useCloseModal();

  const handleConfirm = () => {
    modal.onConfirm?.();
    closeModal("assessmentBeforeTreatmentConfirm");
  };

  const handleCancel = () => {
    modal.onCancel?.();
    closeModal("assessmentBeforeTreatmentConfirm");
  };

  if (!modal.isOpen) {
    return null;
  }

  return (
    <BaseModal
      isOpen={modal.isOpen}
      onClose={handleCancel}
      title="Tratamento de Fisioterapia/TENS pendente"
      maxWidth="md"
    >
      <div className="p-5">
        <p className="text-sm text-gray-600 mb-6">
          O paciente possui um tratamento de Fisioterapia/TENS agendado para
          hoje. Deseja mesmo mover a consulta para &quot;Em andamento&quot;
          antes de concluir o tratamento?
        </p>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Continuar
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default AssessmentBeforeTreatmentConfirmModal;
