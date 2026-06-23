import React from "react";
import { render, screen } from "@testing-library/react";
import AppointmentCardBadges from "../AppointmentCardBadges";
import { APPOINTMENT_CARD_OVERLAY_LABELS } from "../../../styles/cardStyles";
import type { IGroupedPatient } from "../../../utils/patientGrouping";
import { AppointmentType, Priority } from "@/types/types";

describe("AppointmentCardBadges", () => {
  const createGroupedPatient = (treatmentTypes: string[]): IGroupedPatient => ({
    patientId: 1,
    name: "Test Patient",
    treatmentTypes: treatmentTypes as AppointmentType[],
    appointmentIds: [1, 2],
    combinedType: "combined",
    priority: "1" as Priority,
    originalType: "physiotherapy" as AppointmentType,
  });

  describe("Missed/Cancelled Badges", () => {
    it("should display MISSED badge when isMissed is true", () => {
      render(
        <AppointmentCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      const badge = screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.missed);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-red-100", "text-red-700");
    });

    it("should display CANCELLED badge when isCancelled is true", () => {
      render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={true}
          isNextToBeAttended={false}
        />,
      );

      const badge = screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.cancelled);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-gray-300", "text-gray-700");
    });

    it("should not display missed or cancelled badges when both are false", () => {
      render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.missed)).not.toBeInTheDocument();
      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.cancelled)).not.toBeInTheDocument();
    });

    it("should display both badges when both isMissed and isCancelled are true", () => {
      render(
        <AppointmentCardBadges
          isMissed={true}
          isCancelled={true}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.missed)).toBeInTheDocument();
      expect(screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.cancelled)).toBeInTheDocument();
    });
  });

  describe("Next to be Attended Badge", () => {
    it('should display APPOINTMENT_CARD_OVERLAY_LABELS.next badge when isNextToBeAttended is true', () => {
      render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.next)).toBeInTheDocument();
    });

    it('should not display APPOINTMENT_CARD_OVERLAY_LABELS.next badge when isNextToBeAttended is false', () => {
      render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.next)).not.toBeInTheDocument();
    });

    it('should not display APPOINTMENT_CARD_OVERLAY_LABELS.next badge when patient is missed', () => {
      render(
        <AppointmentCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.next)).not.toBeInTheDocument();
    });

    it('should not display APPOINTMENT_CARD_OVERLAY_LABELS.next badge when patient is cancelled', () => {
      render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={true}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.next)).not.toBeInTheDocument();
    });

    it('should not display APPOINTMENT_CARD_OVERLAY_LABELS.next badge when patient is both missed and cancelled', () => {
      render(
        <AppointmentCardBadges
          isMissed={true}
          isCancelled={true}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.next)).not.toBeInTheDocument();
    });
  });

  describe("Treatment Type Count Badges", () => {
    it("should not display treatment count badges when groupedPatient is undefined", () => {
      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      const badgeContainer = container.querySelector(".absolute.top-1.left-1");
      expect(badgeContainer).not.toBeInTheDocument();
    });

    it("should display physiotherapy count badge when groupedPatient has physiotherapy treatments", () => {
      const groupedPatient = createGroupedPatient([
        "physiotherapy",
        "physiotherapy",
      ]);

      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
          groupedPatient={groupedPatient}
        />,
      );

      const physiotherapyBadge = container.querySelector(".bg-yellow-200");
      expect(physiotherapyBadge).toBeInTheDocument();
      expect(physiotherapyBadge).toHaveTextContent("2");
    });

    it("should display tens count badge when groupedPatient has tens treatments", () => {
      const groupedPatient = createGroupedPatient(["tens", "tens", "tens"]);

      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
          groupedPatient={groupedPatient}
        />,
      );

      const tensBadge = container.querySelector(".bg-blue-200");
      expect(tensBadge).toBeInTheDocument();
      expect(tensBadge).toHaveTextContent("3");
    });

    it("should display both count badges when groupedPatient has both treatment types", () => {
      const groupedPatient = createGroupedPatient([
        "physiotherapy",
        "tens",
        "physiotherapy",
      ]);

      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
          groupedPatient={groupedPatient}
        />,
      );

      const physiotherapyBadge = container.querySelector(".bg-yellow-200");
      const tensBadge = container.querySelector(".bg-blue-200");

      expect(physiotherapyBadge).toBeInTheDocument();
      expect(physiotherapyBadge).toHaveTextContent("2");
      expect(tensBadge).toBeInTheDocument();
      expect(tensBadge).toHaveTextContent("1");
    });

    it("should not display badges when groupedPatient has no treatments", () => {
      const groupedPatient = createGroupedPatient([]);

      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
          groupedPatient={groupedPatient}
        />,
      );

      const physiotherapyBadge = container.querySelector(".bg-yellow-200");
      const tensBadge = container.querySelector(".bg-blue-200");

      expect(physiotherapyBadge).not.toBeInTheDocument();
      expect(tensBadge).not.toBeInTheDocument();
    });

    it("should correctly count multiple instances of the same treatment type", () => {
      const groupedPatient = createGroupedPatient([
        "physiotherapy",
        "physiotherapy",
        "physiotherapy",
        "tens",
      ]);

      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
          groupedPatient={groupedPatient}
        />,
      );

      const physiotherapyBadge = container.querySelector(".bg-yellow-200");
      const tensBadge = container.querySelector(".bg-blue-200");

      expect(physiotherapyBadge).toHaveTextContent("3");
      expect(tensBadge).toHaveTextContent("1");
    });

    it("should count only appointments on this card, not patient-day totals", () => {
      const cancelledScheduledCard = createGroupedPatient([
        "physiotherapy",
        "physiotherapy",
      ]);

      const { container: scheduledContainer } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={true}
          isNextToBeAttended={false}
          groupedPatient={cancelledScheduledCard}
        />,
      );

      expect(
        scheduledContainer.querySelector(".bg-yellow-200"),
      ).toHaveTextContent("2");

      const completedCard = createGroupedPatient(["physiotherapy"]);

      const { container: completedContainer } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
          groupedPatient={completedCard}
        />,
      );

      expect(
        completedContainer.querySelector(".bg-yellow-200"),
      ).toHaveTextContent("1");
    });
  });

  describe("Combined Badge Scenarios", () => {
    it("should display all badge types when all conditions are met", () => {
      const groupedPatient = createGroupedPatient(["physiotherapy", "tens"]);

      const { container } = render(
        <AppointmentCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={true}
          groupedPatient={groupedPatient}
        />,
      );

      // Missed badge should show
      expect(screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.missed)).toBeInTheDocument();

      // APPOINTMENT_CARD_OVERLAY_LABELS.next should NOT show because patient is missed
      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.next)).not.toBeInTheDocument();

      // Treatment counts should show
      expect(container.querySelector(".bg-yellow-200")).toBeInTheDocument();
      expect(container.querySelector(".bg-blue-200")).toBeInTheDocument();
    });

    it("should handle all false conditions gracefully", () => {
      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.missed)).not.toBeInTheDocument();
      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.cancelled)).not.toBeInTheDocument();
      expect(screen.queryByText(APPOINTMENT_CARD_OVERLAY_LABELS.next)).not.toBeInTheDocument();
      expect(
        container.querySelector(".absolute.top-1.left-1"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Badge Styling and Classes", () => {
    it("should apply correct positioning classes to missed badge", () => {
      render(
        <AppointmentCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      const badge = screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.missed);
      expect(badge).toHaveClass("absolute", "top-1", "right-1", "z-10");
    });

    it("should apply correct positioning classes to next badge", () => {
      render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={true}
        />,
      );

      const badge = screen.getByText(APPOINTMENT_CARD_OVERLAY_LABELS.next);
      expect(badge).toHaveClass("absolute", "top-1", "right-1", "z-10");
    });

    it("should apply correct positioning classes to treatment count container", () => {
      const groupedPatient = createGroupedPatient(["physiotherapy"]);

      const { container } = render(
        <AppointmentCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
          groupedPatient={groupedPatient}
        />,
      );

      const badgeContainer = container.querySelector(".absolute.top-1.left-1");
      expect(badgeContainer).toHaveClass("flex", "gap-1");
    });
  });
});
