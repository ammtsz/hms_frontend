import React from "react";
import NewAppointmentForm from "@/features/board/components/Scheduling/NewAppointmentForm";
import BaseModal from "@/components/common/BaseModal";

interface NewAppointmentFormModalProps {
  onClose: () => void;
  onSuccess: (success: boolean) => void;
  title: string;
  subtitle: string;
  showDateField?: boolean;
  validationDate?: string;
}

const NewAppointmentFormModal: React.FC<NewAppointmentFormModalProps> = ({
  onClose,
  onSuccess,
  title,
  subtitle,
  showDateField = false,
  validationDate,
}) => {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="xl"
    >
      <div className="p-6">
        <NewAppointmentForm
          showDateField={showDateField}
          validationDate={validationDate}
          onFormSuccess={() => {
            onSuccess(true);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </BaseModal>
  );
};

export default NewAppointmentFormModal;
