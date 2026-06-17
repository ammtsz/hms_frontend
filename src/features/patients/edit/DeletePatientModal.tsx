import React, { useRef, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { Button, Field, Input } from "@/components/ui";

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
  isDeleting: boolean;
}

const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  isDeleting,
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const expectedText = "EXCLUIR";
  const isConfirmed = confirmationText.toUpperCase() === expectedText;

  const handleClose = () => {
    setConfirmationText("");
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Excluir Paciente"
      maxWidth="md"
      initialFocusRef={confirmationInputRef}
    >
      <div className="p-6">
        {/* Warning Message */}
        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Esta ação não pode ser desfeita!
          </p>
          <p className="text-sm text-gray-600">
            Você está prestes a excluir permanentemente o paciente:
          </p>
          <p className="text-base font-bold text-gray-900 mt-2">
            {patientName}
          </p>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-yellow-800 font-semibold mb-2">
            ⚠️ Importante:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>
              Todos os dados do paciente serão excluídos, incluindo histórico de
              atendimentos e registros de tratamento caso existam
            </li>
            <li>Esta ação não poderá ser revertida</li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <Field
            label={
              <>
                Digite{" "}
                <span className="font-bold text-red-600">{expectedText}</span>{" "}
                para confirmar:
              </>
            }
          >
          <Input
            ref={confirmationInputRef}
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Digite EXCLUIR"
            disabled={isDeleting}
          />
          </Field>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            variant="danger"
            isLoading={isDeleting}
            loadingText="Excluindo..."
            disabled={!isConfirmed}
            className="flex-1"
          >
            Excluir Permanentemente
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeletePatientModal;
