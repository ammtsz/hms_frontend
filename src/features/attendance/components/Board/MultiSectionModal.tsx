import React from "react";
import { useMultiSectionModal, useCloseModal } from "@/stores/modalStore";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";

/**
 * Multi-Section Modal - Combines store logic and UI in one component
 * Handles the specific case of moving patients in both sections
 */
export const MultiSectionModal: React.FC = () => {
  const multiSection = useMultiSectionModal();
  const closeModal = useCloseModal();

  const handleConfirm = () => {
    multiSection.onConfirm?.();
    closeModal("multiSection");
  };

  const handleCancel = () => {
    multiSection.onCancel?.();
    closeModal("multiSection");
  };

  // Don't render if modal is not open
  if (!multiSection.isOpen) {
    return null;
  }

  return (
    <BaseModal
      isOpen={multiSection.isOpen}
      onClose={handleCancel}
      title="Múltiplas Seções"
      maxWidth="md"
    >
      <div className="p-5">
        <p className="text-sm text-gray-600 mb-6">
          Este paciente está agendado nas duas consultas. Deseja mover para
          &apos;Sala de Espera&apos; em ambas?
        </p>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Apenas nesta seção
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Mover em ambas
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default MultiSectionModal;
