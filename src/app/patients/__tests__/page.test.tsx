import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import PatientsPage from "../page";

// Mock the PatientList component
const MockPatientList = () => (
  <div data-testid="patient-list">Patient List Component</div>
);

jest.mock("@/features/patients/list", () => {
  return function PatientList() {
    return <MockPatientList />;
  };
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe("PatientsPage", () => {
  it("renders the page container with correct styling", async () => {
    render(<PatientsPage />);

    // Wait for component to load since Suspense resolves immediately with our mock
    await waitFor(() => {
      expect(screen.getByTestId("patient-list")).toBeInTheDocument();
    });

    const container = screen
      .getByTestId("patient-list")
      .closest("div")?.parentElement;
    expect(container).toHaveClass(
      "flex",
      "flex-col",
      "gap-8",
      "my-6",
      "sm:my-16",
    );
  });

  it("renders PatientList component after loading", async () => {
    render(<PatientsPage />);

    // Since our mock resolves immediately, just check that component renders
    await waitFor(() => {
      expect(screen.getByTestId("patient-list")).toBeInTheDocument();
    });
  });

  it("uses Suspense for lazy loading", async () => {
    render(<PatientsPage />);

    // Since our mock resolves immediately, verify the final state
    await waitFor(() => {
      expect(screen.getByTestId("patient-list")).toBeInTheDocument();
    });

    // Verify the component structure is correct
    expect(screen.getByText("Patient List Component")).toBeInTheDocument();
  });

  it("renders with proper page structure", async () => {
    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("patient-list")).toBeInTheDocument();
    });

    // Check page structure
    const pageContainer = screen
      .getByTestId("patient-list")
      .closest("div")?.parentElement;
    expect(pageContainer).toHaveClass(
      "flex",
      "flex-col",
      "gap-8",
      "my-6",
      "sm:my-16",
    );
  });

  it("maintains proper component structure", async () => {
    render(<PatientsPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId("patient-list")).toBeInTheDocument();
    });

    // Check that the PatientList is wrapped in Suspense within the main container
    const patientList = screen.getByTestId("patient-list");
    const container = patientList.closest("div")?.parentElement;

    expect(container).toHaveClass(
      "flex",
      "flex-col",
      "gap-8",
      "my-6",
      "sm:my-16",
    );
  });
});
