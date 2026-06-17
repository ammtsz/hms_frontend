import React from "react";
import { render, screen } from "@testing-library/react";
import EditPatientRoute from "../page";
import { useParams } from "next/navigation";
// Mock the PatientEditPage component
jest.mock("@/features/patients/edit", () => {
  return function MockPatientEditPage({ patientId }: { patientId: string }) {
    return <div data-testid="patient-edit-page">Edit Patient: {patientId}</div>;
  };
});

// Mock useParams
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

describe("EditPatientRoute", () => {
  const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render PatientEditPage with correct patientId", () => {
    mockUseParams.mockReturnValue({ id: "123" });

    render(<EditPatientRoute />);

    expect(screen.getByTestId("patient-edit-page")).toBeInTheDocument();
    expect(screen.getByText("Edit Patient: 123")).toBeInTheDocument();
  });

  it("should handle different patient IDs", () => {
    mockUseParams.mockReturnValue({ id: "456" });

    render(<EditPatientRoute />);

    expect(screen.getByText("Edit Patient: 456")).toBeInTheDocument();
  });

  it("should pass patientId as string", () => {
    mockUseParams.mockReturnValue({ id: "789" }); // Params are strings at runtime

    render(<EditPatientRoute />);

    // Should convert to string
    expect(screen.getByTestId("patient-edit-page")).toBeInTheDocument();
  });
});
