"use client";

import React from "react";
import { Patient, PatientBasic } from "@/types/types";
import BaseModal from "@/components/common/BaseModal";
import NewPatientCheckInForm from "./NewPatientCheckInForm";
import { useCloseModal, useNewPatientCheckInModal } from "@/stores/modalStore";
import { getTodayClinic } from "@/utils/timezoneDate";

const NewPatientCheckInModal: React.FC = () => {
  const newPatientCheckIn = useNewPatientCheckInModal();
  const closeModal = useCloseModal();

  const { patient, attendanceId, isOpen, onComplete } = newPatientCheckIn;

  const patientForCheckIn: Patient = {
    ...(patient as PatientBasic),
    birthDate: patient?.birthDate || "", // Use birthDate from backend or empty string if not available
    mainComplaint: "", // Default value since PatientBasic doesn't have mainComplaint
    startDate: getTodayClinic(), // Default value since PatientBasic doesn't have startDate
    dischargeDate: null, // Default value since PatientBasic doesn't have dischargeDate
    nextAttendanceDates: [], // Default empty array
    currentRecommendations: {
      // Default recommendations
      date: "",
      food: "",
      water: "",
      ointment: "",
      physiotherapy: false,
      tens: false,
      returnWeeks: 0,
    },
    previousAttendances: [], // Default empty array
    missingAppointmentsStreak: 0,
  };

  const handleClose = () => {
    closeModal("newPatientCheckIn");
  };

  const handleSuccess = (updatedPatient: Patient) => {
    if (onComplete && updatedPatient) {
      onComplete(true);
    }
    closeModal("newPatientCheckIn");
  };

  // Don't render if modal is not open
  if (!isOpen || !patient) {
    return null;
  }
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Check-in do Novo Paciente"
      maxWidth="md"
    >
      <NewPatientCheckInForm
        patient={patientForCheckIn}
        attendanceId={attendanceId}
        onSuccess={handleSuccess}
        onCancel={handleClose}
      />
    </BaseModal>
  );
};

export default NewPatientCheckInModal;
