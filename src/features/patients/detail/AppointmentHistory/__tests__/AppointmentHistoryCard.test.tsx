import React from "react";
import { render, screen } from "@/utils/testUtils";
import { AppointmentHistoryCard } from "../AppointmentHistoryCard";
import { Patient } from "@/types/types";

// Mock all required dependencies
jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  usePatientAppointments: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock("@/api/query/hooks/useConsultationQueries", () => ({
  useConsultations: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/features/patients/detail/shared/hooks/usePagination", () => ({
  usePagination: jest.fn(() => ({
    visibleItems: [],
    hasMoreItems: false,
    showMore: jest.fn(),
    totalItems: 0,
    visibleCount: 0,
  })),
}));

jest.mock("@/utils/apiTransformers", () => ({
  transformAppointmentToPrevious: jest.fn((appointment) => appointment),
}));

jest.mock("@/utils/appointmentHistoryUtils", () => ({
  groupHistoryAppointmentsByDate: jest.fn(() => []),
}));

jest.mock("@/components/common/LoadingSpinner", () => ({
  LoadingSpinner: ({ message }: { message: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
}));

jest.mock("@/features/patients/detail/shared/ShowMoreButton", () => ({
  ShowMoreButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Show More</button>
  ),
}));

const mockPatient: Patient = {
  id: "1",
  name: "John Smith",
  phone: "(555) 123-4567",
  birthDate: "1980-05-15",
  mainConcern: "Frequent headaches",
  status: "D",
  priority: "2",
  startDate: "2024-01-15",
  dischargeDate: null,
  nextAppointmentDates: [
    {
      date: "2024-12-28",
      type: "assessment",
    },
  ],
  currentRecommendations: {
    date: "2024-12-20",
    homeExercises: "Stretching daily",
    painManagement: "Ice after activity",
    medications: "Diclofenac gel twice daily",
    physiotherapy: true,
    tens: false,
    returnWeeks: 2,
  },
  previousAppointments: [],
  missingAppointmentsStreak: 0,
};

describe("AppointmentHistoryCard - Integration", () => {
  it("renders the component successfully", () => {
    render(<AppointmentHistoryCard patient={mockPatient} />);

    expect(screen.getByText("Appointment History")).toBeInTheDocument();
  });

  // Note: This is a lightweight integration test to ensure the component renders.
  // Detailed unit tests for sub-components are in AppointmentHistory/__tests__/
  // - AppointmentHistoryHeader.test.tsx (10 tests)
  // - StatusFilterButtons.test.tsx (10 tests)
  // - AbsenceNote.test.tsx (11 tests)
  // - AppointmentItem.test.tsx (covered via integration)
  // - useAppointmentHistory.test.ts (11 tests)
  // - utils.test.ts (14 tests)
});
