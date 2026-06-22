import React from "react";
import { render, screen } from "@testing-library/react";
import { AttendanceStatusBadges } from "../AttendanceStatusBadges";
import { ATTENDANCE_HISTORY_STATUS_LABELS } from "@/utils/attendanceStatusLabels";

describe("AttendanceStatusBadges", () => {
  describe("absence badges", () => {
    it("renders cancelled badge", () => {
      render(<AttendanceStatusBadges absenceStatus="cancelled" />);

      const badge = screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.cancelled);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("bg-orange-200");
      expect(badge.className).toContain("text-orange-900");
    });

    it("renders missed badge", () => {
      render(<AttendanceStatusBadges absenceStatus="missed" />);

      const badge = screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.missed);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("bg-red-200");
      expect(badge.className).toContain("text-red-900");
    });
  });

  describe("scheduled appointment badges", () => {
    it("renders next appointment badge for first item", () => {
      render(
        <AttendanceStatusBadges
          absenceStatus="none"
          attendanceStatus="scheduled"
          isNextAppointment={true}
        />,
      );

      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.next)).toBeInTheDocument();
      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
    });

    it("renders upcoming badge for upcoming appointments", () => {
      render(
        <AttendanceStatusBadges
          absenceStatus="none"
          attendanceStatus="scheduled"
          isUpcoming={true}
          isNextAppointment={false}
        />,
      );

      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.soon)).toBeInTheDocument();
      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
    });

    it("renders only scheduled badge for regular appointments", () => {
      render(
        <AttendanceStatusBadges
          absenceStatus="none"
          attendanceStatus="scheduled"
          isUpcoming={false}
          isNextAppointment={false}
        />,
      );

      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
      expect(screen.queryByText(ATTENDANCE_HISTORY_STATUS_LABELS.next)).not.toBeInTheDocument();
      expect(screen.queryByText("Soon")).not.toBeInTheDocument();
    });

    it("does not render scheduled badge for cancelled appointments", () => {
      render(
        <AttendanceStatusBadges
          absenceStatus="cancelled"
          attendanceStatus="scheduled"
          isNextAppointment={true}
        />,
      );

      expect(screen.queryByText(ATTENDANCE_HISTORY_STATUS_LABELS.scheduled)).not.toBeInTheDocument();
      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.cancelled)).toBeInTheDocument();
    });
  });

  describe("status config badges", () => {
    it("renders status config badge when provided and no absence", () => {
      const statusConfig = {
        label: ATTENDANCE_HISTORY_STATUS_LABELS.completed,
        badgeClass: "bg-green-100 text-green-800",
        icon: <span>✓</span>,
      };

      render(
        <AttendanceStatusBadges
          absenceStatus="none"
          statusConfig={statusConfig}
        />,
      );

      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.completed)).toBeInTheDocument();
    });

    it("does not render status config badge for absences", () => {
      const statusConfig = {
        label: ATTENDANCE_HISTORY_STATUS_LABELS.completed,
        badgeClass: "bg-green-100 text-green-800",
        icon: <span>✓</span>,
      };

      render(
        <AttendanceStatusBadges
          absenceStatus="cancelled"
          statusConfig={statusConfig}
        />,
      );

      expect(screen.queryByText(ATTENDANCE_HISTORY_STATUS_LABELS.completed)).not.toBeInTheDocument();
      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.cancelled)).toBeInTheDocument();
    });
  });

  describe("empty states", () => {
    it("renders nothing when no badges apply", () => {
      const { container } = render(
        <AttendanceStatusBadges absenceStatus="none" />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("multiple badges", () => {
    it("renders multiple badges together", () => {
      render(
        <AttendanceStatusBadges
          absenceStatus="none"
          attendanceStatus="scheduled"
          isNextAppointment={true}
          isUpcoming={false}
        />,
      );

      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.next)).toBeInTheDocument();
      expect(screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
    });
  });
});
