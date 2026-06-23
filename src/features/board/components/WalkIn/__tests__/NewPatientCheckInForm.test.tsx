import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewPatientCheckInForm from "../NewPatientCheckInForm";
import { Patient } from "@/types/types";
import { useSelectablePrioritiesForForm } from "@/features/board/hooks/useSelectablePrioritiesForForm";

import {
  PatientPriority,
  PatientStatus,
  AttendanceType,
  AttendanceStatus,
} from "@/api/types";
import { SystemOptionType } from "@/types/systemOptions";
// Mock the APIs
jest.mock("@/api/patients");

// Create mock functions for React Query mutations
const mockCreateAttendanceMutateAsync = jest.fn();
const mockCheckInAttendanceMutateAsync = jest.fn();

jest.mock("@/api/query/hooks/useAttendanceQueries", () => ({
  useCreateAttendance: () => ({
    mutateAsync: mockCreateAttendanceMutateAsync,
  }),
  useCheckInAttendance: () => ({
    mutateAsync: mockCheckInAttendanceMutateAsync,
  }),
}));

// Mock useUpdatePatient hook
const mockUpdatePatientMutateAsync = jest.fn();
jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  useUpdatePatient: () => ({
    mutateAsync: mockUpdatePatientMutateAsync,
  }),
}));

jest.mock("@/features/board/hooks/useSelectablePrioritiesForForm", () => ({
  useSelectablePrioritiesForForm: jest.fn(),
}));

const mockPatient: Patient = {
  id: "1",
  name: "John Smith",
  phone: "(11) 99999-9999",
  birthDate: "1990-01-01",
  priority: "2",
  status: "N",
  mainConcern: "Test complaint",
  startDate: "2026-01-29",
  dischargeDate: null,
  nextAttendanceDates: [],
  currentRecommendations: {
    date: "2026-01-29",
    food: "",
    water: "",
    ointment: "",
    physiotherapy: false,
    tens: false,
    returnWeeks: 0,
  },
  previousAttendances: [],
  missingAppointmentsStreak: 0,
};

const defaultProps = {
  patient: mockPatient,
  onSuccess: jest.fn(),
  onCancel: jest.fn(),
};

const renderComponent = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NewPatientCheckInForm {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
};

describe("NewPatientCheckInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useSelectablePrioritiesForForm as jest.Mock).mockReturnValue({
      sortedPriorities: [
        {
          id: 1,
          type: SystemOptionType.PRIORITY,
          value: "1",
          label: "Priority",
          isActive: true,
          sortOrder: 1,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 2,
          type: SystemOptionType.PRIORITY,
          value: "2",
          label: "Standard",
          isActive: true,
          sortOrder: 2,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 3,
          type: SystemOptionType.PRIORITY,
          value: "3",
          label: "Priority 3",
          isActive: true,
          sortOrder: 3,
          createdAt: "",
          updatedAt: "",
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Mock successful patient update via React Query hook
    mockUpdatePatientMutateAsync.mockResolvedValue({
      success: true,
      value: {
        id: 1,
        name: "John Smith",
        priority: PatientPriority.LEVEL_2,
        patientStatus: PatientStatus.DISCHARGED,
        startDate: "2025-01-15",
        missingAppointmentsStreak: 0,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      },
    });

    // Mock successful attendance creation
    mockCreateAttendanceMutateAsync.mockResolvedValue({
      id: 123,
      patientId: 1,
      type: AttendanceType.ASSESSMENT,
      status: AttendanceStatus.SCHEDULED,
      scheduledDate: "2025-01-15",
      scheduledTime: "09:00",
    });

    // Mock successful check-in
    mockCheckInAttendanceMutateAsync.mockResolvedValue({
      id: 123,
      patientId: 1,
      type: AttendanceType.ASSESSMENT,
      status: AttendanceStatus.CHECKED_IN,
      scheduledDate: "2025-01-15",
      scheduledTime: "09:00",
      checkedInTime: "09:00:00",
    });
  });

  it("renders form fields with patient data", () => {
    renderComponent();

    expect(screen.getByDisplayValue("John Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("(11) 99999-9999")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1990-01-01")).toBeInTheDocument();

    // Check priority select by getting the element and checking its value
    const prioritySelect = screen.getByRole("combobox");
    expect(prioritySelect).toHaveValue("2");
  });

  it("validates required fields", async () => {
    renderComponent();

    // Clear name field
    fireEvent.change(screen.getByDisplayValue("John Smith"), {
      target: { value: "" },
    });

    // Try to submit
    fireEvent.click(screen.getByText("Check In"));

    await waitFor(() => {
      expect(screen.getByText("Name is required.")).toBeInTheDocument();
    });
  });

  it("validates phone is required", async () => {
    renderComponent();

    // Clear phone field
    const phoneInput = screen.getByDisplayValue("(11) 99999-9999");
    fireEvent.change(phoneInput, { target: { value: "" } });

    // Try to submit
    fireEvent.click(screen.getByText("Check In"));

    await waitFor(() => {
      expect(screen.getByText("Phone is required.")).toBeInTheDocument();
    });
  });

  it("validates birth date is required", async () => {
    renderComponent();

    // Clear birth date field
    const birthDateInput = screen.getByDisplayValue("1990-01-01");
    fireEvent.change(birthDateInput, { target: { value: "" } });

    // Try to submit
    fireEvent.click(screen.getByText("Check In"));

    await waitFor(() => {
      expect(screen.getByText("Birth date is required.")).toBeInTheDocument();
    });
  });

  it("handles phone number formatting", () => {
    renderComponent();

    const phoneInput = screen.getByDisplayValue("(11) 99999-9999");
    fireEvent.change(phoneInput, { target: { value: "11988887777" } });

    expect(phoneInput).toHaveValue("(11) 98888-7777");
  });

  it("handles priority field changes", () => {
    renderComponent();

    // The mock patient has priority "2", which corresponds to "2 - Standard"
    const prioritySelect = screen.getByDisplayValue("2 - Standard");
    fireEvent.change(prioritySelect, { target: { value: "1" } });

    expect(prioritySelect).toHaveValue("1");
  });

  it("handles birth date field changes", () => {
    renderComponent();

    const birthDateInput = screen.getByDisplayValue("1990-01-01");
    fireEvent.change(birthDateInput, { target: { value: "1985-05-15" } });

    expect(birthDateInput).toHaveValue("1985-05-15");
  });

  it("creates new attendance when no attendanceId provided", async () => {
    renderComponent();

    fireEvent.click(screen.getByText("Check In"));

    await waitFor(() => {
      expect(mockUpdatePatientMutateAsync).toHaveBeenCalledWith({
        patientId: "1",
        data: expect.objectContaining({
          name: "John Smith",
          phone: "(11) 99999-9999",
          birthDate: "1990-01-01",
        }),
      });
      expect(mockCreateAttendanceMutateAsync).toHaveBeenCalled();
      expect(mockCheckInAttendanceMutateAsync).toHaveBeenCalled();
    });
  });

  it("checks in existing attendance when attendanceId provided", async () => {
    renderComponent({ attendanceId: 123 });

    fireEvent.click(screen.getByText("Check In"));

    await waitFor(() => {
      expect(mockUpdatePatientMutateAsync).toHaveBeenCalled();
      expect(mockCreateAttendanceMutateAsync).not.toHaveBeenCalled();
      expect(mockCheckInAttendanceMutateAsync).toHaveBeenCalledWith({
        attendanceId: 123,
        patientName: "John Smith",
      });
    });
  });

  it("handles API errors gracefully", async () => {
    mockUpdatePatientMutateAsync.mockRejectedValue(
      new Error("Patient update failed"),
    );

    renderComponent();

    fireEvent.click(screen.getByText("Check In"));

    await waitFor(() => {
      expect(
        screen.getByText(/Error processing check-in/),
      ).toBeInTheDocument();
    });
  });

  it("calls onSuccess callback with updated patient data", async () => {
    const onSuccess = jest.fn();
    renderComponent({ onSuccess });

    fireEvent.click(screen.getByText("Check In"));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John Smith",
          phone: "(11) 99999-9999",
          status: "T",
        }),
      );
    });
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = jest.fn();
    renderComponent({ onCancel });

    fireEvent.click(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("disables form during submission", async () => {
    // Mock a slow API call
    mockUpdatePatientMutateAsync.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                value: {
                  id: 1,
                  name: "John Smith",
                  priority: PatientPriority.LEVEL_2,
                  patientStatus: PatientStatus.DISCHARGED,
                  startDate: "2025-01-15",
                  missingAppointmentsStreak: 0,
                  createdAt: "2025-01-15T00:00:00Z",
                  updatedAt: "2025-01-15T00:00:00Z",
                },
              }),
            100,
          ),
        ),
    );

    renderComponent();

    fireEvent.click(screen.getByText("Check In"));

    // Check that form is disabled during submission
    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Smith")).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeDisabled();
  });
});
