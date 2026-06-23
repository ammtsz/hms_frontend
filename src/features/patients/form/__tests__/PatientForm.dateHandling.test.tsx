import { render, screen, fireEvent } from "@testing-library/react";
import PatientForm from "../index";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";

// Mock the useRouter hook
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the API
jest.mock("@/api/patients", () => ({
  createPatient: jest.fn(),
  getPatients: jest.fn().mockResolvedValue({
    success: true,
    value: [],
  }),
}));

jest.mock("@/api/appointments", () => ({
  getAppointmentsByDate: jest.fn().mockResolvedValue({
    success: true,
    value: [],
  }),
}));

const renderWithProvider = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClinicTimezoneProvider>{component}</ClinicTimezoneProvider>
    </QueryClientProvider>,
  );
};

describe("PatientForm Date Handling", () => {
  test("should handle invalid date input without crashing", () => {
    renderWithProvider(<PatientForm />);

    const birthDateInput = screen.getByLabelText(/Date of Birth/i);

    // Test various invalid date inputs that could crash the app
    const invalidDates = [
      "invalid-date",
      "2025-13-45", // Invalid month and day
      "2025-02-30", // Invalid date for February
      "", // Empty string
      "2025-", // Incomplete date
      "abc-def-ghi", // Non-numeric
    ];

    invalidDates.forEach((invalidDate) => {
      expect(() => {
        fireEvent.change(birthDateInput, { target: { value: invalidDate } });
      }).not.toThrow();
    });
  });

  test("should handle valid date input correctly", () => {
    renderWithProvider(<PatientForm />);

    const birthDateInput = screen.getByLabelText(/Date of Birth/i);

    // Test valid date
    fireEvent.change(birthDateInput, { target: { value: "1990-05-15" } });

    expect(birthDateInput).toHaveValue("1990-05-15");
  });

  test("should not crash when toISOString is called on invalid dates", () => {
    renderWithProvider(<PatientForm />);

    const birthDateInput = screen.getByLabelText(/Date of Birth/i);

    // Set an invalid date
    fireEvent.change(birthDateInput, { target: { value: "invalid-date" } });

    // The component should still render without errors
    expect(birthDateInput).toBeInTheDocument();

    // The form should still be functional
    const nameInput = screen.getByLabelText(/Name/i);
    expect(() => {
      fireEvent.change(nameInput, { target: { value: "Test Patient" } });
    }).not.toThrow();
  });

  test("should not reset birth date to today when invalid date is entered", () => {
    renderWithProvider(<PatientForm />);

    const birthDateInput = screen.getByLabelText(/Date of Birth/i);

    fireEvent.change(birthDateInput, { target: { value: "1990-05-15" } });
    fireEvent.change(birthDateInput, { target: { value: "invalid-date" } });

    expect(birthDateInput).toHaveValue("");
  });
});
