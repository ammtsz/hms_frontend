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
} from "../../../hooks/usePostConsultationForm";
import type { PatientResponseDto } from "@/api/types";
import {
  PatientPriority,
  PatientStatus as ApiPatientStatus,
} from "@/api/types";

describe("BasicInfoTab", () => {
  const mockFormData: PostConsultationFormData = {
    mainConcern: "Test complaint",
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
    mainConcern: "Test complaint",
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
      screen.getByText("Basic Appointment Information"),
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

    expect(
      screen.getByLabelText("Main Concern / Reason for Consultation *"),
    ).toHaveValue("Test complaint");
    expect(screen.getByLabelText("Treatment Status *")).toHaveValue("T");
    expect(screen.getByLabelText("Registration Date *")).toHaveValue(
      "2024-01-01",
    );
    expect(screen.getByLabelText("Consultation Notes")).toHaveValue(
      "Test notes",
    );
  });

  it("should call onFormDataChange when main concern changes", () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        currentTreatmentStatus="N"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    const mainConcernTextarea = screen.getByLabelText(
      "Main Concern / Reason for Consultation *",
    );
    fireEvent.change(mainConcernTextarea, {
      target: { value: "New complaint" },
    });

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "mainConcern",
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

    const treatmentStatusSelect = screen.getByLabelText("Treatment Status *");
    fireEvent.change(treatmentStatusSelect, { target: { value: "T" } });

    expect(mockOnFormDataChange).toHaveBeenCalledWith("patientStatus", "T");
  });

  it("should not display return weeks input (moved to Automatic Scheduling tab)", () => {
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
      screen.queryByLabelText("Weeks until return *"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Weeks until return"),
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

    const notesTextarea = screen.getByLabelText("Consultation Notes");
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

    const startDateInput = screen.getByLabelText("Registration Date *");
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

    const startDateInput = screen.getByLabelText("Registration Date *");
    expect(startDateInput).toBeDisabled();
    expect(
      screen.getByText("Registration date cannot be changed (read-only)"),
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

    expect(
      screen.getByText("Current status: In Treatment"),
    ).toBeInTheDocument();
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

    // Only T and D options are shown in the select dropdown
    expect(screen.getByText("T - In treatment")).toBeInTheDocument();
    expect(screen.getByText("D - Discharged")).toBeInTheDocument();

    // N and C are not shown in dropdown, but current status is displayed below the select
    expect(screen.getByText("Current status: New patient")).toBeInTheDocument();
  });

  it("should display discharge warning when appropriate", () => {
    const dischargeFormData = {
      ...mockFormData,
      patientStatus: "D" as const,
    };

    render(
      <BasicInfoTab
        formData={dischargeFormData}
        currentTreatmentStatus="D"
        patientData={mockPatientData}
        onFormDataChange={mockOnFormDataChange}
        onDateChange={mockOnDateChange}
      />,
    );

    expect(screen.getByText(/Selecting "Discharged"/i)).toBeInTheDocument();
  });

  it("should handle different treatment statuses correctly", () => {
    const testCases: Array<{ status: PatientStatusValue; label: string }> = [
      { status: "N", label: "New patient" },
      { status: "T", label: "In Treatment" },
      { status: "D", label: "Discharged" },
      { status: "C", label: "Consecutive no-shows" },
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

      expect(screen.getByText(`Current status: ${label}`)).toBeInTheDocument();

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
