import React from "react";
import { render, screen } from "@testing-library/react";
import { NextConsultationCard } from "../NextConsultationCard";
import type {
  AttendanceResponseDto,
  AttendanceType,
  AttendanceStatus,
} from "@/api/types";

describe("NextConsultationCard", () => {
  const mockNextConsultation: AttendanceResponseDto = {
    id: 103,
    patientId: 1,
    type: "assessment" as AttendanceType,
    status: "scheduled" as AttendanceStatus,
    scheduledDate: "2026-02-19",
    scheduledTime: "15:00",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  };

  /** createdDate in the past so getWeeksUntil(scheduledDate, createdDate) > 0 and "Return in" is shown */
  const createdDateForWeeks = "2026-01-01";

  describe("loading state", () => {
    it("should show loading message when fetching", () => {
      render(
        <NextConsultationCard
          nextAssessmentConsultation={null}
          fetchingAttendances={true}
        />,
      );

      expect(
        screen.getByText(/Searching for created appointments/i),
      ).toBeInTheDocument();
      expect(screen.getByText("⏳")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error message when fetch fails", () => {
      render(
        <NextConsultationCard
          nextAssessmentConsultation={null}
          attendancesError="Failed to load attendances"
        />,
      );

      expect(
        screen.getByText(/Error fetching appointments/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load attendances"),
      ).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("should show next consultation details", () => {
      render(
        <NextConsultationCard
          nextAssessmentConsultation={mockNextConsultation}
        />,
      );

      expect(
        screen.getByText(/Return of Assessment Consultation/i),
      ).toBeInTheDocument();

      expect(screen.getByText("02/19/2026")).toBeInTheDocument();
    });

    it("should show return weeks when provided", () => {
      render(
        <NextConsultationCard
          nextAssessmentConsultation={mockNextConsultation}
          returnWeeks={5}
          createdDate={createdDateForWeeks}
        />,
      );

      expect(screen.getByText("7 weeks")).toBeInTheDocument();
    });

    it("should use singular form for 1 week", () => {
      const oneWeekLater: AttendanceResponseDto = {
        ...mockNextConsultation,
        scheduledDate: "2026-02-02",
      };
      render(
        <NextConsultationCard
          nextAssessmentConsultation={oneWeekLater}
          returnWeeks={1}
          createdDate="2026-01-26"
        />,
      );

      expect(screen.getByText("1 week")).toBeInTheDocument();
    });
  });

  describe("null state", () => {
    it("should render nothing when no consultation and not loading/error", () => {
      const { container } = render(
        <NextConsultationCard nextAssessmentConsultation={null} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
