/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BasicInfoTab from "../BasicInfoTab";
import type {
  PostConsultationFormData,
  PatientStatusValue,
} from "../../../hooks/usePostAttendanceForm";
import type { PatientResponseDto } from "@/api/types";
import {
  PatientPriority,
  PatientStatus as ApiPatientStatus,
} from "@/api/types";

describe("BasicInfoTab", () => {
  const mockFormData: PostConsultationFormData = {
    mainComplaint: "Test complaint",
    patientStatus: "T",
    startDate: "2024-01-01",
    returnWeeks: 4,
    food: "Test food",
    water: "Test water",
    ointments: "Test ointments",
    recommendations: {
      returnWeeks: 4,
      returnWhenTreatmentComplete: false,
    },
    notes: "Test notes",
    noGeneralRecommendations: false,
    noTreatmentRecommendations: false,
  };

  const mockPatientData: PatientResponseDto = {
    id: 1,
    name: "Test Patient",
    phone: "1234567890",
    priority: PatientPriority.LEVEL_3,
    patientStatus: ApiPatientStatus.NEW_PATIENT,
    birthDate: "1990-01-01",
    mainComplaint: "Test complaint",
    startDate: "2024-01-01",
    missingAppointmentsStreak: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const mockOnFormDataChange = jest.fn();
  const mockOnDateChange = jest.fn(() => jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    expect(
      screen.getByText("Informações Básicas do Atendimento"),
    ).toBeInTheDocument();
  });

  it("should display form fields with correct values", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    expect(screen.getByLabelText("Queixa / Motivo da Consulta *")).toHaveValue(
      "Test complaint",
    );
    expect(screen.getByLabelText("Status do Tratamento *")).toHaveValue("T");
    expect(screen.getByLabelText("Data de Cadastro *")).toHaveValue(
      "2024-01-01",
    );
    expect(screen.getByLabelText("Notas da Consulta")).toHaveValue(
      "Test notes",
    );
  });

  it("should call onFormDataChange when main complaint changes", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    const mainComplaintTextarea = screen.getByLabelText(
      "Queixa / Motivo da Consulta *",
    );
    fireEvent.change(mainComplaintTextarea, {
      target: { value: "New complaint" },
    });

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "mainComplaint",
      "New complaint",
    );
  });

  it("should call onFormDataChange when treatment status changes", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    const treatmentStatusSelect = screen.getByLabelText(
      "Status do Tratamento *",
    );
    fireEvent.change(treatmentStatusSelect, { target: { value: "T" } });

    expect(mockOnFormDataChange).toHaveBeenCalledWith("patientStatus", "T");
  });

  it("should not display return weeks input (moved to Agendamentos Automáticos tab)", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    // ReturnWeeks field should not be in BasicInfoTab
    expect(
      screen.queryByLabelText("Semanas para Retorno *"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Semanas para Retorno"),
    ).not.toBeInTheDocument();
  });

  it("should call onFormDataChange when notes change", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    const notesTextarea = screen.getByLabelText("Notas da Consulta");
    fireEvent.change(notesTextarea, { target: { value: "New notes" } });

    expect(mockOnFormDataChange).toHaveBeenCalledWith("notes", "New notes");
  });

  it("should call onDateChange when start date changes", () => {
    const mockDateChangeHandler = jest.fn();
    mockOnDateChange.mockReturnValue(mockDateChangeHandler);

    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    const startDateInput = screen.getByLabelText("Data de Cadastro *");
    fireEvent.change(startDateInput, { target: { value: "2024-02-01" } });

    expect(mockOnDateChange).toHaveBeenCalledWith("startDate");
    expect(mockDateChangeHandler).toHaveBeenCalled();
  });

  it("should disable start date input when patient has existing start date", () => {
    const patientWithStartDate = {
      ...mockPatientData,
      startDate: "2023-01-01",
    };

    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="T"
        patientData={patientWithStartDate}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    const startDateInput = screen.getByLabelText("Data de Cadastro *");
    expect(startDateInput).toBeDisabled();
    expect(
      screen.getByText(
        "Data de cadastro não pode ser alterada (somente leitura)",
      ),
    ).toBeInTheDocument();
  });

  it("should display current treatment status correctly", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="T"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    expect(screen.getByText("Status atual: Em Tratamento")).toBeInTheDocument();
  });

  it("should display all treatment status options", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    // Only T and A options are shown in the select dropdown
    expect(screen.getByText("T - Em tratamento")).toBeInTheDocument();
    expect(screen.getByText("A - Alta do tratamento")).toBeInTheDocument();

    // N and F are not shown in dropdown, but current status is displayed below the select
    expect(screen.getByText("Status atual: Novo Paciente")).toBeInTheDocument();
  });

  it("should display discharge warning when appropriate", () => {
    const dischargeFormData = {
      ...mockFormData,
      patientStatus: "A" as const,
    };

    render(
      <BasicInfoTab
        formData={dischargeFormData}
        currentTreatmentStatus="A"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    expect(
      screen.getByText(/ao selecionar "Alta do tratamento"/i),
    ).toBeInTheDocument();
  });

  it("should handle different treatment statuses correctly", () => {
    const testCases: Array<{ status: PatientStatusValue; label: string }> = [
      { status: "N", label: "Novo Paciente" },
      { status: "T", label: "Em Tratamento" },
      { status: "A", label: "Alta" },
      { status: "F", label: "Ausente" },
    ];

    testCases.forEach(({ status, label }) => {
      const { rerender } = render(
        <BasicInfoTab
          formData={mockFormData}
          currentTreatmentStatus={status}
          patientData={mockPatientData}
          onFormDataChange={mockOnFormDataChange}
          onDateChange={mockOnDateChange}
        />,
      );

      expect(screen.getByText(`Status atual: ${label}`)).toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });
  });

  it("should have proper form structure and styling", () => {
    const { container } = render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("space-y-4");

    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      expect(input).toHaveClass(
        "w-full",
        "px-3",
        "py-2",
        "border",
        "border-gray-300",
        "rounded-md",
      );
    });
  });
});
