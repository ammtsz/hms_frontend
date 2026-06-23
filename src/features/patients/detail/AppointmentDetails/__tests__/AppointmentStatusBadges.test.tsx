import React from "react";
import { render, screen } from "@testing-library/react";
import { AppointmentStatusBadges } from "../AppointmentStatusBadges";
import { APPOINTMENT_HISTORY_STATUS_LABELS } from "@/utils/appointmentStatusLabels";

describe("AppointmentStatusBadges", () => {
  describe("absence badges", () => {
    it("renders cancelled badge", () => {
      render(<AppointmentStatusBadges absenceStatus="cancelled" />);

      const badge = screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.cancelled);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("bg-orange-200");
      expect(badge.className).toContain("text-orange-900");
    });

    it("renders missed badge", () => {
      render(<AppointmentStatusBadges absenceStatus="missed" />);

      const badge = screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.missed);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("bg-red-200");
      expect(badge.className).toContain("text-red-900");
    });
  });

  describe("scheduled appointment badges", () => {
    it("renders next appointment badge for first item", () => {
      render(
        <AppointmentStatusBadges
          absenceStatus="none"
          appointmentStatus="scheduled"
          isNextAppointment={true}
        />,
      );

      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.next)).toBeInTheDocument();
      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
    });

    it("renders upcoming badge for upcoming appointments", () => {
      render(
        <AppointmentStatusBadges
          absenceStatus="none"
          appointmentStatus="scheduled"
          isUpcoming={true}
          isNextAppointment={false}
        />,
      );

      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.soon)).toBeInTheDocument();
      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
    });

    it("renders only scheduled badge for regular appointments", () => {
      render(
        <AppointmentStatusBadges
          absenceStatus="none"
          appointmentStatus="scheduled"
          isUpcoming={false}
          isNextAppointment={false}
        />,
      );

      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
      expect(screen.queryByText(APPOINTMENT_HISTORY_STATUS_LABELS.next)).not.toBeInTheDocument();
      expect(screen.queryByText("Soon")).not.toBeInTheDocument();
    });

    it("does not render scheduled badge for cancelled appointments", () => {
      render(
        <AppointmentStatusBadges
          absenceStatus="cancelled"
          appointmentStatus="scheduled"
          isNextAppointment={true}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_HISTORY_STATUS_LABELS.scheduled)).not.toBeInTheDocument();
      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.cancelled)).toBeInTheDocument();
    });
  });

  describe("status config badges", () => {
    it("renders status config badge when provided and no absence", () => {
      const statusConfig = {
        label: APPOINTMENT_HISTORY_STATUS_LABELS.completed,
        badgeClass: "bg-green-100 text-green-800",
        icon: <span>✓</span>,
      };

      render(
        <AppointmentStatusBadges
          absenceStatus="none"
          statusConfig={statusConfig}
        />,
      );

      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.completed)).toBeInTheDocument();
    });

    it("does not render status config badge for absences", () => {
      const statusConfig = {
        label: APPOINTMENT_HISTORY_STATUS_LABELS.completed,
        badgeClass: "bg-green-100 text-green-800",
        icon: <span>✓</span>,
      };

      render(
        <AppointmentStatusBadges
          absenceStatus="cancelled"
          statusConfig={statusConfig}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_HISTORY_STATUS_LABELS.completed)).not.toBeInTheDocument();
      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.cancelled)).toBeInTheDocument();
    });
  });

  describe("empty states", () => {
    it("renders nothing when no badges apply", () => {
      const { container } = render(
        <AppointmentStatusBadges absenceStatus="none" />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("multiple badges", () => {
    it("renders multiple badges together", () => {
      render(
        <AppointmentStatusBadges
          absenceStatus="none"
          appointmentStatus="scheduled"
          isNextAppointment={true}
          isUpcoming={false}
        />,
      );

      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.next)).toBeInTheDocument();
      expect(screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.scheduled)).toBeInTheDocument();
    });
  });
});
