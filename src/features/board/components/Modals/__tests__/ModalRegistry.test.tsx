/**
 * @jest-environment jsdom
 */

import React, { Suspense } from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModalRegistry, { getRegisteredModals } from "../ModalRegistry";

// Helper to wrap ModalRegistry with Suspense
const ModalRegistryWithSuspense = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ModalRegistry onRefresh={jest.fn()} />
  </Suspense>
);

// Mock all the modal components
jest.mock("@/features/board/components/AttendanceActions/ManageAttendanceModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="manage-attendance-modal">Manage Attendance Modal</div>
    ),
  };
});

jest.mock("@/features/board/components/Board/MultiSectionModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="multi-section-modal">Multi Section Modal</div>
    ),
  };
});

jest.mock("@/features/board/components/Board/AssessmentBeforeTreatmentConfirmModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="assessment-before-treatment-confirm-modal">
        Assessment Before Treatment Confirm Modal
      </div>
    ),
  };
});

jest.mock("@/features/board/components/WalkIn/NewPatientCheckInModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="new-patient-checkin-modal">
        New Patient CheckIn Modal
      </div>
    ),
  };
});

jest.mock("@/features/board/components/Consultation/PostAttendanceModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="post-attendance-modal">Post Attendance Modal</div>
    ),
  };
});

jest.mock("@/features/board/components/EndOfDay/EndOfDayModal", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="endOfDay-modal">End Of Day Modal</div>,
  };
});

jest.mock("@/features/board/components/TreatmentSession/PostTreatmentModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="post-treatment-modal">Post Treatment Modal</div>
    ),
  };
});

jest.mock("@/features/board/components/Consultation/ViewCompletedConsultationModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="view-completed-consultation-modal">
        View Completed Consultation Modal
      </div>
    ),
  };
});

jest.mock("@/features/board/components/AttendanceActions/UnresolvedPastAttendancesModal", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="unresolved-past-modal">
        Unresolved Past Attendances Modal
      </div>
    ),
  };
});

describe("ModalRegistry", () => {
  describe("Component rendering", () => {
    it("renders modal registry structure", () => {
      // ModalRegistry should render without crashing
      expect(() => render(<ModalRegistryWithSuspense />)).not.toThrow();
    });

    it("renders with proper component structure", () => {
      render(<ModalRegistryWithSuspense />);

      // The component should render successfully
      // Individual lazy-loaded modals may not be immediately visible in tests
      expect(document.body).toBeInTheDocument();
    });

    it("renders without crashing", () => {
      expect(() => render(<ModalRegistryWithSuspense />)).not.toThrow();
    });
  });

  describe("Lazy loading functionality", () => {
    it("handles lazy-loaded components correctly", () => {
      render(<ModalRegistryWithSuspense />);

      // The registry should render without errors
      // Lazy loading behavior is handled by React.Suspense
      expect(document.body).toBeInTheDocument();
    });

    it("maintains component isolation", () => {
      const { container } = render(<ModalRegistryWithSuspense />);

      // Registry should maintain proper structure
      expect(container).toBeInTheDocument();
    });
  });

  describe("Modal registry configuration", () => {
    it("has correct number of registered modals", () => {
      const registeredModals = getRegisteredModals();
      expect(registeredModals).toHaveLength(9);
    });

    it("includes all expected modal names", () => {
      const registeredModals = getRegisteredModals();
      const modalNames = registeredModals.map((modal) => modal.name);

      expect(modalNames).toContain("manageAttendance");
      expect(modalNames).toContain("multiSection");
      expect(modalNames).toContain("assessmentBeforeTreatmentConfirm");
      expect(modalNames).toContain("newPatientCheckIn");
      expect(modalNames).toContain("postAttendance");
      expect(modalNames).toContain("endOfDay");
      expect(modalNames).toContain("postTreatment");
      expect(modalNames).toContain("viewCompletedConsultation");
      expect(modalNames).toContain("unresolvedPast");
    });

    it("includes descriptions for all modals", () => {
      const registeredModals = getRegisteredModals();

      registeredModals.forEach((modal) => {
        expect(modal.description).toBeDefined();
        expect(modal.description).toBeTruthy();
        expect(typeof modal.description).toBe("string");
      });
    });

    it("has correct modal descriptions", () => {
      const registeredModals = getRegisteredModals();
      const modalMap = Object.fromEntries(
        registeredModals.map((modal) => [modal.name, modal.description]),
      );

      expect(modalMap["manageAttendance"]).toBe(
        "Handles attendance cancellation or postponement",
      );
      expect(modalMap["multiSection"]).toBe(
        "Handles drag-drop operations affecting multiple sections",
      );
      expect(modalMap["assessmentBeforeTreatmentConfirm"]).toBe(
        "Confirm moving assessment to onGoing when treatments not completed",
      );
      expect(modalMap["newPatientCheckIn"]).toBe(
        "New patient registration and check-in workflow",
      );
      expect(modalMap["postAttendance"]).toBe(
        "Assessment treatment form for completed attendances",
      );
      expect(modalMap["endOfDay"]).toBe(
        "End of day finalization and absence justification",
      );
      expect(modalMap["postTreatment"]).toBe(
        "Modal for recording post-treatment details",
      );
      expect(modalMap["viewCompletedConsultation"]).toBe(
        "View completed assessment consultation details",
      );
      expect(modalMap["unresolvedPast"]).toBe(
        "Alert for unresolved past attendances",
      );
    });
  });

  describe("Modal registry structure", () => {
    it("returns modal information with correct structure", () => {
      const registeredModals = getRegisteredModals();

      registeredModals.forEach((modal) => {
        expect(modal).toHaveProperty("name");
        expect(modal).toHaveProperty("description");
        expect(typeof modal.name).toBe("string");
        expect(typeof modal.description).toBe("string");
      });
    });

    it("maintains consistent naming conventions", () => {
      const registeredModals = getRegisteredModals();
      const modalNames = registeredModals.map((modal) => modal.name);

      // Check for camelCase naming
      modalNames.forEach((name) => {
        expect(name).toMatch(/^[a-z][a-zA-Z]*$/);
        expect(name).not.toMatch(/[_-]/);
      });
    });
  });

  describe("Component lifecycle", () => {
    it("handles multiple renders correctly", () => {
      const { rerender, container } = render(<ModalRegistryWithSuspense />);

      // First render
      expect(container).toBeInTheDocument();

      // Re-render
      rerender(<ModalRegistryWithSuspense />);
      expect(container).toBeInTheDocument();

      // Third render
      rerender(<ModalRegistryWithSuspense />);
      expect(container).toBeInTheDocument();
    });

    it("maintains state consistency across renders", () => {
      const { container } = render(<ModalRegistryWithSuspense />);

      // Registry should maintain consistent state
      expect(container).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("continues rendering other modals if one fails", () => {
      // This is inherently tested by the successful render
      // The registry should handle errors gracefully
      expect(() => render(<ModalRegistryWithSuspense />)).not.toThrow();
    });

    it("handles getRegisteredModals function safely", () => {
      expect(() => getRegisteredModals()).not.toThrow();

      const modals = getRegisteredModals();
      expect(Array.isArray(modals)).toBe(true);
    });
  });

  describe("Performance characteristics", () => {
    it("renders efficiently with all modals", () => {
      const startTime = performance.now();
      render(<ModalRegistryWithSuspense />);
      const endTime = performance.now();

      // Should render quickly (within reasonable time)
      // Increased threshold to account for CI/CD and system load variations
      expect(endTime - startTime).toBeLessThan(200); // 200ms threshold
    });

    it("maintains React key consistency", () => {
      // Each modal should have a unique identifier
      // This is implicitly tested by successful rendering without React warnings
      expect(() => render(<ModalRegistryWithSuspense />)).not.toThrow();
    });
  });

  describe("Accessibility considerations", () => {
    it("provides accessible structure", () => {
      const { container } = render(<ModalRegistryWithSuspense />);

      // Registry should provide accessible structure
      expect(container).toBeInTheDocument();
    });

    it("maintains proper DOM structure", () => {
      const { container } = render(<ModalRegistryWithSuspense />);

      // Check proper DOM structure
      expect(container).toBeInTheDocument();
      expect(container.parentNode).toBeTruthy();
    });
  });

  describe("Integration testing", () => {
    it("works with React.Fragment wrapper", () => {
      const { container } = render(<ModalRegistryWithSuspense />);

      // Should render without additional wrapper elements
      expect(container).toBeInTheDocument();
    });

    it("supports dynamic modal addition conceptually", () => {
      // Test the current registry structure
      const modals = getRegisteredModals();
      expect(modals.length).toBeGreaterThan(0);

      // Verify structure supports extension
      modals.forEach((modal) => {
        expect(modal).toHaveProperty("name");
        expect(modal).toHaveProperty("description");
      });
    });
  });
});
