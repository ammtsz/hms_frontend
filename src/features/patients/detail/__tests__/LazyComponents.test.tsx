import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  LazyHeaderCard,
  LazyCurrentTreatmentCard,
  LazyAppointmentHistoryCard,
  LazyScheduledAppointmentsCard,
  LazyPatientNotesCard,
  LazySessionBreakdownCard,
  LazyComponentWrapper,
} from "../LazyComponents";
import type { Patient } from "@/types/types";

// Mock all the lazy-loaded components
jest.mock("@/features/patients/detail/HeaderCard", () => ({
  HeaderCard: () => <div data-testid="header-card">Header Card</div>,
}));

jest.mock("@/features/patients/detail/CurrentTreatmentCard", () => ({
  CurrentTreatmentCard: () => (
    <div data-testid="current-treatment-card">Current Treatment Card</div>
  ),
}));

jest.mock(
  "@/features/patients/detail/AppointmentHistory/AppointmentHistoryCard",
  () => ({
    AppointmentHistoryCard: () => (
      <div data-testid="appointment-history-card">Appointment History Card</div>
    ),
  }),
);

jest.mock(
  "@/features/patients/detail/ScheduledAppointments/ScheduledAppointmentsCard",
  () => ({
    ScheduledAppointmentsCard: () => (
      <div data-testid="scheduled-appointments-card">
        Scheduled Appointments Card
      </div>
    ),
  }),
);

jest.mock("@/features/patients/detail/PatientNotesCard", () => ({
  PatientNotesCard: () => (
    <div data-testid="patient-notes-card">Patient Notes Card</div>
  ),
}));

jest.mock("@/features/patients/detail/SessionBreakdown", () => ({
  SessionBreakdownCard: () => (
    <div data-testid="session-breakdown-card">Session Breakdown Card</div>
  ),
}));

jest.mock("@/components/common/LoadingFallback", () => {
  return function LoadingFallback({
    message,
  }: {
    size?: string;
    message?: string;
  }) {
    return <div data-testid="loading-fallback">{message || "Loading..."}</div>;
  };
});

describe("LazyComponents", () => {
  const mockPatient = {
    id: "1",
    name: "Test Patient",
    email: "test@example.com",
  } as unknown as Patient;

  describe("LazyHeaderCard", () => {
    it("should render LazyHeaderCard when loaded", async () => {
      render(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyHeaderCard patient={mockPatient} />
        </React.Suspense>,
      );

      expect(await screen.findByTestId("header-card")).toBeInTheDocument();
      expect(screen.getByText("Header Card")).toBeInTheDocument();
    });
  });

  describe("LazyCurrentTreatmentCard", () => {
    it("should render LazyCurrentTreatmentCard when loaded", async () => {
      render(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyCurrentTreatmentCard patient={mockPatient} />
        </React.Suspense>,
      );

      expect(
        await screen.findByTestId("current-treatment-card"),
      ).toBeInTheDocument();
      expect(screen.getByText("Current Treatment Card")).toBeInTheDocument();
    });
  });

  describe("LazyAppointmentHistoryCard", () => {
    it("should render LazyAppointmentHistoryCard when loaded", async () => {
      render(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyAppointmentHistoryCard patient={mockPatient} />
        </React.Suspense>,
      );

      expect(
        await screen.findByTestId("appointment-history-card"),
      ).toBeInTheDocument();
      expect(screen.getByText("Appointment History Card")).toBeInTheDocument();
    });
  });

  describe("LazyScheduledAppointmentsCard", () => {
    it("should render LazyScheduledAppointmentsCard when loaded", async () => {
      render(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyScheduledAppointmentsCard patient={mockPatient} />
        </React.Suspense>,
      );

      expect(
        await screen.findByTestId("scheduled-appointments-card"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Scheduled Appointments Card"),
      ).toBeInTheDocument();
    });
  });

  describe("LazyPatientNotesCard", () => {
    it("should render LazyPatientNotesCard when loaded", async () => {
      render(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyPatientNotesCard patientId="1" />
        </React.Suspense>,
      );

      expect(
        await screen.findByTestId("patient-notes-card"),
      ).toBeInTheDocument();
      expect(screen.getByText("Patient Notes Card")).toBeInTheDocument();
    });
  });

  describe("LazySessionBreakdownCard", () => {
    it("should render LazySessionBreakdownCard when loaded", async () => {
      render(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazySessionBreakdownCard patient={mockPatient} />
        </React.Suspense>,
      );

      expect(
        await screen.findByTestId("session-breakdown-card"),
      ).toBeInTheDocument();
      expect(screen.getByText("Session Breakdown Card")).toBeInTheDocument();
    });
  });

  describe("LazyComponentWrapper", () => {
    it("should render children when they are loaded", async () => {
      const TestComponent = () => (
        <div data-testid="test-component">Test Component</div>
      );

      render(
        <LazyComponentWrapper>
          <TestComponent />
        </LazyComponentWrapper>,
      );

      expect(await screen.findByTestId("test-component")).toBeInTheDocument();
      expect(screen.getByText("Test Component")).toBeInTheDocument();
    });

    it("should render default fallback while loading", () => {
      const SlowComponent = () => {
        throw new Promise((resolve) => setTimeout(resolve, 1000));
      };

      render(
        <LazyComponentWrapper>
          <SlowComponent />
        </LazyComponentWrapper>,
      );

      expect(screen.getByTestId("loading-fallback")).toBeInTheDocument();
      expect(screen.getByText("Loading component...")).toBeInTheDocument();
    });

    it("should render custom fallback when provided", () => {
      const SlowComponent = () => {
        throw new Promise((resolve) => setTimeout(resolve, 1000));
      };

      const customFallback = (
        <div data-testid="custom-fallback">Custom Loading...</div>
      );

      render(
        <LazyComponentWrapper fallback={customFallback}>
          <SlowComponent />
        </LazyComponentWrapper>,
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
    });

    it("should handle multiple children", async () => {
      const TestComponent1 = () => (
        <div data-testid="test-component-1">Test Component 1</div>
      );
      const TestComponent2 = () => (
        <div data-testid="test-component-2">Test Component 2</div>
      );

      render(
        <LazyComponentWrapper>
          <TestComponent1 />
          <TestComponent2 />
        </LazyComponentWrapper>,
      );

      expect(await screen.findByTestId("test-component-1")).toBeInTheDocument();
      expect(await screen.findByTestId("test-component-2")).toBeInTheDocument();
      expect(screen.getByText("Test Component 1")).toBeInTheDocument();
      expect(screen.getByText("Test Component 2")).toBeInTheDocument();
    });

    it("should handle empty children", () => {
      render(<LazyComponentWrapper>{null}</LazyComponentWrapper>);

      // Should not crash and render nothing
      expect(screen.queryByTestId("loading-fallback")).not.toBeInTheDocument();
    });

    it("should handle fragments as children", async () => {
      const TestComponent = () => (
        <>
          <div data-testid="fragment-child-1">Fragment Child 1</div>
          <div data-testid="fragment-child-2">Fragment Child 2</div>
        </>
      );

      render(
        <LazyComponentWrapper>
          <TestComponent />
        </LazyComponentWrapper>,
      );

      expect(await screen.findByTestId("fragment-child-1")).toBeInTheDocument();
      expect(await screen.findByTestId("fragment-child-2")).toBeInTheDocument();
    });
  });

  describe("Lazy component loading behavior", () => {
    it("should show loading state initially for lazy components", () => {
      const SlowLazyComponent = React.lazy(
        () =>
          new Promise<{ default: React.ComponentType }>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  default: () => (
                    <div data-testid="slow-component">Slow Component</div>
                  ),
                }),
              100,
            ),
          ),
      );

      render(
        <React.Suspense
          fallback={<div data-testid="loading">Loading lazy component...</div>}
        >
          <SlowLazyComponent />
        </React.Suspense>,
      );

      expect(screen.getByTestId("loading")).toBeInTheDocument();
      expect(screen.getByText("Loading lazy component...")).toBeInTheDocument();
    });

    it("should handle lazy component load errors gracefully", async () => {
      const ErrorLazyComponent = React.lazy(() =>
        Promise.reject(new Error("Load failed")),
      );

      // Create error boundary to catch the error
      interface ErrorBoundaryState {
        hasError: boolean;
      }

      class ErrorBoundary extends React.Component<
        React.PropsWithChildren<object>,
        ErrorBoundaryState
      > {
        constructor(props: React.PropsWithChildren<object>) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError(): ErrorBoundaryState {
          return { hasError: true };
        }

        render() {
          if (this.state.hasError) {
            return (
              <div data-testid="error-boundary">Component failed to load</div>
            );
          }

          return this.props.children;
        }
      }

      render(
        <ErrorBoundary>
          <React.Suspense
            fallback={<div data-testid="loading">Loading...</div>}
          >
            <ErrorLazyComponent />
          </React.Suspense>
        </ErrorBoundary>,
      );

      // Initially shows loading
      expect(screen.getByTestId("loading")).toBeInTheDocument();

      // Wait for error to be caught
      await screen.findByTestId("error-boundary");
      expect(screen.getByText("Component failed to load")).toBeInTheDocument();
    });
  });
});
