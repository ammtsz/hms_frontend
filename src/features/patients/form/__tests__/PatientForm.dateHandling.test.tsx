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

    const invalidDates = [
      "invalid-date",
      "02/31/1990",
      "13/01/1990",
      "",
      "05/15",
      "abc",
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

    fireEvent.change(birthDateInput, { target: { value: "05/15/1990" } });

    expect(birthDateInput).toHaveValue("05/15/1990");
  });

  test("should not crash when invalid dates are entered", () => {
    renderWithProvider(<PatientForm />);

    const birthDateInput = screen.getByLabelText(/Date of Birth/i);

    fireEvent.change(birthDateInput, { target: { value: "invalid-date" } });

    expect(birthDateInput).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Name/i);
    expect(() => {
      fireEvent.change(nameInput, { target: { value: "Test Patient" } });
    }).not.toThrow();
  });

  test("should clear display when non-digit input replaces a valid date", () => {
    renderWithProvider(<PatientForm />);

    const birthDateInput = screen.getByLabelText(/Date of Birth/i);

    fireEvent.change(birthDateInput, { target: { value: "05/15/1990" } });
    fireEvent.change(birthDateInput, { target: { value: "invalid-date" } });

    expect(birthDateInput).toHaveValue("");
  });
});
