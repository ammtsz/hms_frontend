import React from "react";
import { render, screen } from "@testing-library/react";
import AttendanceCardBadges from "../AttendanceCardBadges";
import type { IGroupedPatient } from "../../../utils/patientGrouping";
import { AttendanceType, Priority } from "@/types/types";

describe("AttendanceCardBadges", () => {
  const createGroupedPatient = (treatmentTypes: string[]): IGroupedPatient => ({
    patientId: 1,
    name: "Test Patient",
    treatmentTypes: treatmentTypes as AttendanceType[],
    attendanceIds: [1, 2],
    combinedType: "combined",
    priority: "1" as Priority,
    originalType: "physiotherapy" as AttendanceType,
  });

  describe("Missed/Cancelled Badges", () => {
    it("should display FALTA badge when isMissed is true", () => {
      render(
        <AttendanceCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      const badge = screen.getByText("FALTA");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-red-100", "text-red-700");
    });

    it("should display CANCELADO badge when isCancelled is true", () => {
      render(
        <AttendanceCardBadges
          isMissed={false}
          isCancelled={true}
          isNextToBeAttended={false}
        />,
      );

      const badge = screen.getByText("CANCELADO");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-gray-300", "text-gray-700");
    });

    it("should not display missed or cancelled badges when both are false", () => {
      render(
        <AttendanceCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.queryByText("FALTA")).not.toBeInTheDocument();
      expect(screen.queryByText("CANCELADO")).not.toBeInTheDocument();
    });

    it("should display both badges when both isMissed and isCancelled are true", () => {
      render(
        <AttendanceCardBadges
          isMissed={true}
          isCancelled={true}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.getByText("FALTA")).toBeInTheDocument();
      expect(screen.getByText("CANCELADO")).toBeInTheDocument();
    });
  });

  describe("Next to be Attended Badge", () => {
    it('should display "Próximo" badge when isNextToBeAttended is true', () => {
      render(
        <AttendanceCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.getByText("Próximo")).toBeInTheDocument();
    });

    it('should not display "Próximo" badge when isNextToBeAttended is false', () => {
      render(
        <AttendanceCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
    });

    it('should not display "Próximo" badge when patient is missed', () => {
      render(
        <AttendanceCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
    });

    it('should not display "Próximo" badge when patient is cancelled', () => {
      render(
        <AttendanceCardBadges
          isMissed={false}
          isCancelled={true}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
    });

    it('should not display "Próximo" badge when patient is both missed and cancelled', () => {
      render(
        <AttendanceCardBadges
          isMissed={true}
          isCancelled={true}
          isNextToBeAttended={true}
        />,
      );

      expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
    });
  });

  describe("Treatment Type Count Badges", () => {
    it("should not display treatment count badges when groupedPatient is undefined", () => {
      const { container } = render(
        <AttendanceCardBadges
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
        <AttendanceCardBadges
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
        <AttendanceCardBadges
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
        <AttendanceCardBadges
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
        <AttendanceCardBadges
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
        <AttendanceCardBadges
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

    it("should count only attendances on this card, not patient-day totals", () => {
      const cancelledScheduledCard = createGroupedPatient([
        "physiotherapy",
        "physiotherapy",
      ]);

      const { container: scheduledContainer } = render(
        <AttendanceCardBadges
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
        <AttendanceCardBadges
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
        <AttendanceCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={true}
          groupedPatient={groupedPatient}
        />,
      );

      // Missed badge should show
      expect(screen.getByText("FALTA")).toBeInTheDocument();

      // "Próximo" should NOT show because patient is missed
      expect(screen.queryByText("Próximo")).not.toBeInTheDocument();

      // Treatment counts should show
      expect(container.querySelector(".bg-yellow-200")).toBeInTheDocument();
      expect(container.querySelector(".bg-blue-200")).toBeInTheDocument();
    });

    it("should handle all false conditions gracefully", () => {
      const { container } = render(
        <AttendanceCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      expect(screen.queryByText("FALTA")).not.toBeInTheDocument();
      expect(screen.queryByText("CANCELADO")).not.toBeInTheDocument();
      expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
      expect(
        container.querySelector(".absolute.top-1.left-1"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Badge Styling and Classes", () => {
    it("should apply correct positioning classes to missed badge", () => {
      render(
        <AttendanceCardBadges
          isMissed={true}
          isCancelled={false}
          isNextToBeAttended={false}
        />,
      );

      const badge = screen.getByText("FALTA");
      expect(badge).toHaveClass("absolute", "top-1", "right-1", "z-10");
    });

    it("should apply correct positioning classes to next badge", () => {
      render(
        <AttendanceCardBadges
          isMissed={false}
          isCancelled={false}
          isNextToBeAttended={true}
        />,
      );

      const badge = screen.getByText("Próximo");
      expect(badge).toHaveClass("absolute", "top-1", "right-1", "z-10");
    });

    it("should apply correct positioning classes to treatment count container", () => {
      const groupedPatient = createGroupedPatient(["physiotherapy"]);

      const { container } = render(
        <AttendanceCardBadges
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
