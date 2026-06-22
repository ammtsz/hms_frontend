import React from "react";
import NewAttendanceForm from "@/features/attendance/components/Scheduling/NewAttendanceForm";
import BaseModal from "@/components/common/BaseModal";

interface NewAttendanceFormModalProps {
  onClose: () => void;
  onSuccess: (success: boolean) => void;
  title: string;
  subtitle: string;
  showDateField?: boolean;
  validationDate?: string;
}

const NewAttendanceFormModal: React.FC<NewAttendanceFormModalProps> = ({
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
        <NewAttendanceForm
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

export default NewAttendanceFormModal;
