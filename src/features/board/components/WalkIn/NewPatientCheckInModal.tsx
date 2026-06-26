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

  const { patient, appointmentId, isOpen, onComplete } = newPatientCheckIn;

  const patientForCheckIn: Patient = {
    ...(patient as PatientBasic),
    birthDate: patient?.birthDate || "", // Use birthDate from backend or empty string if not available
    mainConcern: "", // Default value since PatientBasic doesn't have mainConcern
    startDate: getTodayClinic(), // Default value since PatientBasic doesn't have startDate
    dischargeDate: null, // Default value since PatientBasic doesn't have dischargeDate
    nextAppointmentDates: [], // Default empty array
    currentRecommendations: {
      // Default recommendations
      date: "",
      homeExercises: "",
      painManagement: "",
      medications: "",
      physiotherapy: false,
      tens: false,
      returnWeeks: 0,
    },
    previousAppointments: [], // Default empty array
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
      title="New Patient Check-in"
      maxWidth="md"
    >
      <NewPatientCheckInForm
        patient={patientForCheckIn}
        appointmentId={appointmentId}
        onSuccess={handleSuccess}
        onCancel={handleClose}
      />
    </BaseModal>
  );
};

export default NewPatientCheckInModal;
