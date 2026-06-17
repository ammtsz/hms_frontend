import React from "react";
import BaseModal from "@/components/common/BaseModal";
import { usePostTreatmentModalHook as usePostTreatmentModal } from "./usePostTreatmentModal";
import { PostTreatmentModalBody } from "./PostTreatmentModalBody";
import { PostTreatmentModalFooter } from "./PostTreatmentModalFooter";

export type { PostTreatmentRow } from "./types";

const PostTreatmentModal: React.FC = () => {
  const {
    isOpen,
    patientName,
    rows,
    rowsByType,
    completedAttendanceIds,
    cancellationReasons,
    generalNotes,
    setGeneralNotes,
    submitError,
    loading,
    error,
    isSubmitting,
    canSubmit,
    uncheckedWithMissingReason,
    isSubmitDisabled,
    toggleRow,
    setCancellationReason,
    handleSubmit,
    handleClose,
    onRetry,
  } = usePostTreatmentModal();

  const handleModalClose = () => {
    if (!isSubmitting) {
      handleClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Registrar Sessão de Tratamento"
      subtitle={patientName ? `Paciente: ${patientName}` : undefined}
      maxWidth="2xl"
      preventOverflow
      showCloseButton={!isSubmitting}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PostTreatmentModalBody
          loading={loading}
          error={error}
          rows={rows}
          rowsByType={rowsByType}
          completedAttendanceIds={completedAttendanceIds}
          cancellationReasons={cancellationReasons}
          generalNotes={generalNotes}
          setGeneralNotes={setGeneralNotes}
          isSubmitting={isSubmitting}
          onToggle={toggleRow}
          onCancellationReasonChange={setCancellationReason}
          onRetry={onRetry}
        />
      </div>
      <PostTreatmentModalFooter
        submitError={submitError}
        canSubmit={canSubmit}
        uncheckedWithMissingReason={uncheckedWithMissingReason}
        isSubmitDisabled={isSubmitDisabled}
        isSubmitting={isSubmitting}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
      />
    </BaseModal>
  );
};

export default PostTreatmentModal;
