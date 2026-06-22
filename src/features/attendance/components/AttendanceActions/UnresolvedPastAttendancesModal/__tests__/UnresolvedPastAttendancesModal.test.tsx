import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UnresolvedPastAttendancesModal from "../UnresolvedPastAttendancesModal";
import { useUnresolvedPastModal, useCloseModal } from "@/stores/modalStore";
import { useAttendanceStore } from "@/stores";

// Mock dependencies
jest.mock("@/stores/modalStore");
jest.mock("@/stores");

const mockCloseModal = jest.fn();
const mockSetSelectedDate = jest.fn();

describe("UnresolvedPastAttendancesModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCloseModal as jest.Mock).mockReturnValue(mockCloseModal);
    (useAttendanceStore as unknown as jest.Mock).mockReturnValue(
      mockSetSelectedDate,
    );
  });

  describe("Rendering", () => {
    it("should not render when dates array is empty", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [],
      });

      const { container } = render(<UnresolvedPastAttendancesModal />);
      expect(container.firstChild).toBeNull();
    });

    it("should not render when dates is undefined", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: undefined,
      });

      const { container } = render(<UnresolvedPastAttendancesModal />);
      expect(container.firstChild).toBeNull();
    });

    it("should render modal when dates exist", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 3,
            statuses: "{scheduled,checked_in}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(screen.getByText("Pending Attendances")).toBeInTheDocument();
      expect(screen.getByText("3 unresolved attendances")).toBeInTheDocument();
    });

    it("should render singular text for single attendance", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 1,
            statuses: "{scheduled}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(screen.getByText("1 unresolved attendance")).toBeInTheDocument();
      expect(screen.getByText("on 1 past date")).toBeInTheDocument();
    });

    it("should render plural text for multiple dates", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 2,
            statuses: "{scheduled}",
          },
          {
            date: "2026-01-28",
            count: 1,
            statuses: "{checked_in}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(screen.getByText("3 unresolved attendances")).toBeInTheDocument();
      expect(screen.getByText("on 2 past dates")).toBeInTheDocument();
    });
  });

  describe("Date List Display", () => {
    it("should display all dates with correct formatting", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 3,
            statuses: "{scheduled,checked_in}",
          },
          {
            date: "2026-01-28",
            count: 2,
            statuses: "{scheduled}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      // Check formatted dates (formatDateBR converts to DD/MM/YYYY)
      expect(screen.getByText("01/30/2026")).toBeInTheDocument();
      expect(screen.getByText("01/28/2026")).toBeInTheDocument();

      // Check counts
      expect(screen.getByText(/3\s+3\s+attendances/)).toBeInTheDocument();
      expect(screen.getByText(/2\s+2\s+attendances/)).toBeInTheDocument();
    });

    it("should translate statuses to Portuguese", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 3,
            statuses: "{scheduled,checked_in}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(screen.getByText(/scheduled \/ waiting room/)).toBeInTheDocument();
    });

    it("should handle array format statuses", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 2,
            statuses: ["scheduled", "in_progress"],
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(screen.getByText(/scheduled \/ in progress/)).toBeInTheDocument();
    });

    it("should render all status translations correctly", () => {
      const statusTests = [
        { statuses: "{scheduled}", expected: "scheduled" },
        { statuses: "{checked_in}", expected: "waiting room" },
        { statuses: "{in_progress}", expected: "in progress" },
        { statuses: "{completed}", expected: "completed" },
        { statuses: "{cancelled}", expected: "cancelled" },
        { statuses: "{missed}", expected: "missed" },
      ];

      statusTests.forEach(({ statuses, expected }) => {
        (useUnresolvedPastModal as jest.Mock).mockReturnValue({
          isOpen: true,
          dates: [
            {
              date: "2026-01-30",
              count: 1,
              statuses,
            },
          ],
        });

        const { unmount } = render(<UnresolvedPastAttendancesModal />);
        expect(
          screen.getByText(new RegExp(`\\(${expected}\\)`)),
        ).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("User Interactions", () => {
    it("should call closeModal when close button is clicked", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 1,
            statuses: "{scheduled}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      const closeButton = screen.getByText("Close");
      fireEvent.click(closeButton);

      expect(mockCloseModal).toHaveBeenCalledWith("unresolvedPast");
    });

    it("should navigate to selected date when 'View' button is clicked", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 3,
            statuses: "{scheduled}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      const viewButton = screen.getByText("View");
      fireEvent.click(viewButton);

      expect(mockSetSelectedDate).toHaveBeenCalledWith("2026-01-30");
      expect(mockCloseModal).toHaveBeenCalledWith("unresolvedPast");
    });

    it("should handle ISO date strings by extracting date part", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30T08:00:00.000Z",
            count: 1,
            statuses: "{scheduled}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      const viewButton = screen.getByText("View");
      fireEvent.click(viewButton);

      expect(mockSetSelectedDate).toHaveBeenCalledWith("2026-01-30");
    });

    it("should handle multiple dates with individual navigation", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 2,
            statuses: "{scheduled}",
          },
          {
            date: "2026-01-28",
            count: 1,
            statuses: "{checked_in}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      const viewButtons = screen.getAllByText("View");
      expect(viewButtons).toHaveLength(2);

      // Click first date
      fireEvent.click(viewButtons[0]);
      expect(mockSetSelectedDate).toHaveBeenCalledWith("2026-01-30");

      // Click second date
      mockSetSelectedDate.mockClear();
      fireEvent.click(viewButtons[1]);
      expect(mockSetSelectedDate).toHaveBeenCalledWith("2026-01-28");
    });
  });

  describe("Summary Calculations", () => {
    it("should calculate total attendances across all dates", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 5,
            statuses: "{scheduled}",
          },
          {
            date: "2026-01-28",
            count: 3,
            statuses: "{checked_in}",
          },
          {
            date: "2026-01-25",
            count: 2,
            statuses: "{in_progress}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(screen.getByText("10 unresolved attendances")).toBeInTheDocument();
      expect(screen.getByText("on 3 past dates")).toBeInTheDocument();
    });
  });

  describe("Info Messages", () => {
    it("should show singular info message for one attendance", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 1,
            statuses: "{scheduled}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(
        screen.getByText(
          "This attendance needs to be completed, cancelled or marked as missed.",
        ),
      ).toBeInTheDocument();
    });

    it("should show plural info message for multiple attendances", () => {
      (useUnresolvedPastModal as jest.Mock).mockReturnValue({
        isOpen: true,
        dates: [
          {
            date: "2026-01-30",
            count: 5,
            statuses: "{scheduled}",
          },
        ],
      });

      render(<UnresolvedPastAttendancesModal />);

      expect(
        screen.getByText(
          "These attendances need to be completed, cancelled or marked as missed.",
        ),
      ).toBeInTheDocument();
    });
  });
});
