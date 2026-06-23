import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  EmptyState,
  ErrorState,
  AppointmentHistoryEmpty,
  ScheduledAppointmentsEmpty,
  TreatmentRecommendationsEmpty,
  CurrentTreatmentEmpty,
} from "../CardStates";

describe("CardStates Components", () => {
  describe("EmptyState", () => {
    it("renders basic empty state correctly", () => {
      render(
        <EmptyState
          icon="📝"
          title="Test Title"
          description="Test description"
        />,
      );

      expect(screen.getByText("📝")).toBeInTheDocument();
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("renders with custom icon background color", () => {
      const { container } = render(
        <EmptyState
          icon="📅"
          title="Test Title"
          description="Test description"
          iconBgColor="bg-blue-50"
        />,
      );

      const iconContainer = container.querySelector(".bg-blue-50");
      expect(iconContainer).toBeInTheDocument();
    });

    it("renders children when provided", () => {
      render(
        <EmptyState icon="📝" title="Test Title" description="Test description">
          <button>Custom Action</button>
        </EmptyState>,
      );

      expect(
        screen.getByRole("button", { name: "Custom Action" }),
      ).toBeInTheDocument();
    });
  });

  describe("ErrorState", () => {
    it("renders error state correctly", () => {
      const mockRetry = jest.fn();

      render(
        <ErrorState
          title="Error Title"
          message="Error message"
          onRetry={mockRetry}
        />,
      );

      expect(screen.getByText("⚠️")).toBeInTheDocument();
      expect(screen.getByText("Error Title")).toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });

    it("calls onRetry when retry button is clicked", () => {
      const mockRetry = jest.fn();

      render(
        <ErrorState
          title="Error Title"
          message="Error message"
          onRetry={mockRetry}
        />,
      );

      fireEvent.click(screen.getByText("Try again"));
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it("renders custom retry label", () => {
      const mockRetry = jest.fn();

      render(
        <ErrorState
          title="Error Title"
          message="Error message"
          onRetry={mockRetry}
          retryLabel="Custom Retry"
        />,
      );

      expect(screen.getByText("Custom Retry")).toBeInTheDocument();
    });
  });

  describe("AppointmentHistoryEmpty", () => {
    it("renders when patient has no next appointment dates", () => {
      const mockPatient = { nextAppointmentDates: [] };

      render(<AppointmentHistoryEmpty patient={mockPatient} />);

      expect(
        screen.getByText("No appointments recorded"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Schedule the first appointment/),
      ).toBeInTheDocument();
    });

    it("renders with next appointment date information", () => {
      const mockPatient = {
        nextAppointmentDates: [{ date: "2024-12-15" }],
      };

      render(<AppointmentHistoryEmpty patient={mockPatient} />);

      expect(
        screen.getByText("No appointments recorded"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Next appointment scheduled for/),
      ).toBeInTheDocument();
    });
  });

  describe("ScheduledAppointmentsEmpty", () => {
    it("renders with correct links", () => {
      render(<ScheduledAppointmentsEmpty patientId="123" />);

      expect(screen.getByText("No upcoming appointments")).toBeInTheDocument();

      const scheduleLink = screen.getByText("📅 Schedule Appointment");
      expect(scheduleLink).toBeInTheDocument();
      expect(scheduleLink.closest("a")).toHaveAttribute(
        "href",
        "/schedule?patient=123&action=schedule",
      );

      const viewScheduleLink = screen.getByText("View Schedule");
      expect(viewScheduleLink).toBeInTheDocument();
      expect(viewScheduleLink.closest("a")).toHaveAttribute("href", "/schedule");
    });
  });

  describe("TreatmentRecommendationsEmpty", () => {
    it("renders empty state message", () => {
      render(<TreatmentRecommendationsEmpty />);

      expect(
        screen.getByText("Recommendations unavailable"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /This patient does not yet have any treatment recommendations recorded./,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("CurrentTreatmentEmpty", () => {
    it("renders current treatment empty state", () => {
      render(<CurrentTreatmentEmpty />);

      expect(screen.getByText("No active treatment")).toBeInTheDocument();
      expect(
        screen.getByText(/currently has no ongoing treatments/),
      ).toBeInTheDocument();
    });
  });
});
