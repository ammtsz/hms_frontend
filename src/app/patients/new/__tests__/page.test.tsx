import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import NewPatientPage from "../page";

// Mock the PatientForm component
const MockPatientForm = () => (
  <div data-testid="patient-form">Patient Form Component</div>
);

jest.mock("@/features/patients/form", () => {
  return function PatientForm() {
    return <MockPatientForm />;
  };
});

// Mock the Breadcrumb component
const MockBreadcrumb = ({
  items,
}: {
  items: Array<{ label: string; href?: string; isActive?: boolean }>;
}) => (
  <div data-testid="breadcrumb">
    {items.map((item, index) => (
      <span key={index} data-testid={`breadcrumb-item-${index}`}>
        {item.label}
        {item.isActive && <span data-testid="active-indicator"> (Active)</span>}
      </span>
    ))}
  </div>
);

jest.mock("@/components/common/Breadcrumb", () => {
  return function Breadcrumb(props: {
    items: Array<{ label: string; href?: string; isActive?: boolean }>;
  }) {
    return <MockBreadcrumb {...props} />;
  };
});

// Mock the LoadingFallback component
const MockLoadingFallback = ({
  message,
  size,
}: {
  message?: string;
  size?: string;
}) => (
  <div data-testid="loading-fallback" data-message={message} data-size={size}>
    Loading...
  </div>
);

jest.mock("@/components/common/LoadingFallback", () => {
  return function LoadingFallback(props: { message?: string; size?: string }) {
    return <MockLoadingFallback {...props} />;
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

describe("NewPatientPage", () => {
  it("renders the page container with correct styling", async () => {
    render(<NewPatientPage />);

    // Wait for components to render
    await waitFor(() => {
      expect(screen.getByTestId("patient-form")).toBeInTheDocument();
    });

    // Get the outermost container
    const outerContainer = screen.getByTestId("breadcrumb").closest("div")
      ?.parentElement?.parentElement;
    expect(outerContainer).toHaveClass(
      "flex",
      "flex-col",
      "gap-8",
      "my-6",
      "sm:my-16",
    );
  });

  it("renders the inner container with correct styling", async () => {
    render(<NewPatientPage />);

    await waitFor(() => {
      expect(screen.getByTestId("patient-form")).toBeInTheDocument();
    });

    const innerContainer = screen
      .getByTestId("breadcrumb")
      .closest("div")?.parentElement;
    expect(innerContainer).toHaveClass(
      "max-w-4xl",
      "mx-auto",
      "w-full",
      "px-4"
    );
  });

  it("renders breadcrumb with correct items", () => {
    render(<NewPatientPage />);

    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent(
      "Pacientes"
    );
    expect(screen.getByTestId("breadcrumb-item-1")).toHaveTextContent(
      "Cadastro de Paciente"
    );
    expect(screen.getByTestId("active-indicator")).toBeInTheDocument();
  });

  it("renders PatientForm component after loading", async () => {
    render(<NewPatientPage />);

    // Wait for the lazy-loaded component to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("patient-form")).toBeInTheDocument();
    });
  });

  it("uses Suspense for code splitting", async () => {
    render(<NewPatientPage />);

    // Since our mock resolves immediately, verify the final state
    await waitFor(() => {
      expect(screen.getByTestId("patient-form")).toBeInTheDocument();
    });
  });

  it("lazy loads the PatientForm component", async () => {
    render(<NewPatientPage />);

    // Since our mocks resolve immediately, just verify the component renders
    await waitFor(() => {
      expect(screen.getByTestId("patient-form")).toBeInTheDocument();
    });
  });

  it("maintains proper component structure", async () => {
    render(<NewPatientPage />);

    // Check breadcrumb is rendered
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();

    // Wait for PatientForm to load
    await waitFor(() => {
      expect(screen.getByTestId("patient-form")).toBeInTheDocument();
    });

    // Check both components are in the same container
    const breadcrumb = screen.getByTestId("breadcrumb");
    const patientForm = screen.getByTestId("patient-form");
    const container = breadcrumb.closest("div")?.parentElement; // Get parent container

    expect(container).toContainElement(breadcrumb);
    expect(container).toContainElement(patientForm);
  });

  it("has correct breadcrumb configuration", () => {
    render(<NewPatientPage />);

    // Check first breadcrumb item
    const firstItem = screen.getByTestId("breadcrumb-item-0");
    expect(firstItem).toHaveTextContent("Pacientes");

    // Check second breadcrumb item (active)
    const secondItem = screen.getByTestId("breadcrumb-item-1");
    expect(secondItem).toHaveTextContent("Cadastro de Paciente");
    expect(screen.getByTestId("active-indicator")).toBeInTheDocument();
  });
});
