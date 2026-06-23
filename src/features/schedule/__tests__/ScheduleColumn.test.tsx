import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScheduleColumn from "../components/ScheduleColumn";
import { SCHEDULE_COLUMN_MESSAGES } from "../utils/scheduleFilterConstants";
import { AttendanceType } from "@/types/types";
import { AttendanceStatus } from "@/api/types";
import { useOpenCancellation } from "@/stores/modalStore";

jest.mock("@/features/board/components/Cards/AttendanceTypeTag", () => {
  return function MockAttendanceTypeTag({
    type,
    count,
  }: {
    type: AttendanceType;
    count: number;
  }) {
    return (
      <span data-testid="attendance-type-tag" data-type={type}>
        {type}-{count}
      </span>
    );
  };
});

jest.mock("@/utils/dateUtils", () => ({
  formatDisplayDateWithDayOfWeek: jest.fn(
    (dateStr: string) => `Formatted ${dateStr}`,
  ),
}));

jest.mock("@/components/common/Spinner", () => {
  return function MockSpinner({
    size,
    className,
  }: {
    size: string;
    className: string;
  }) {
    return (
      <div data-testid="spinner" data-size={size} className={className}>
        Loading...
      </div>
    );
  };
});

jest.mock("../hooks/useHolidayForDate", () => ({
  useHolidayForDate: () => ({ holiday: null, isLoading: false }),
}));

jest.mock("@/stores/modalStore", () => ({
  useOpenCancellation: jest.fn(),
}));

const mockUseOpenCancellation = useOpenCancellation as jest.MockedFunction<
  typeof useOpenCancellation
>;

describe("ScheduleColumn", () => {
  const mockOpenCancellation = jest.fn();

  const mockPatient1 = {
    id: "1",
    name: "John Smith",
    attendanceId: 100,
    attendanceType: "assessment" as AttendanceType,
  };

  const mockPatient2 = {
    id: "2",
    name: "Emily Williams",
    attendanceId: 101,
    attendanceType: "physiotherapy" as AttendanceType,
  };

  const defaultScheduleItem = {
    date: "2024-01-15",
    patients: [mockPatient1, mockPatient2],
  };

  const defaultProps = {
    title: "Consultations",
    scheduleItems: [defaultScheduleItem],
    openScheduleIdx: [] as number[],
    setOpenScheduleIdx: jest.fn(),
    columnType: "assessment" as const,
    isLoading: false,
    isRefreshing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenCancellation.mockReturnValue(mockOpenCancellation);
  });

  function rowExpandButtons() {
    return screen.getAllByRole("button", { expanded: false });
  }

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<ScheduleColumn {...defaultProps} />);

      expect(screen.getByText("Consultations")).toBeInTheDocument();
    });

    it("displays column title correctly", () => {
      const customTitle = "Custom Column Title";
      render(<ScheduleColumn {...defaultProps} title={customTitle} />);

      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it("displays schedule items count correctly - singular", () => {
      render(<ScheduleColumn {...defaultProps} />);

      expect(screen.getByText("1 date with appointments")).toBeInTheDocument();
    });

    it("displays schedule items count correctly - plural", () => {
      const multipleItems = [
        defaultScheduleItem,
        { ...defaultScheduleItem, date: "2024-01-16" },
      ];
      render(<ScheduleColumn {...defaultProps} scheduleItems={multipleItems} />);

      expect(screen.getByText("2 dates with appointments")).toBeInTheDocument();
    });

    it("applies correct styling classes", () => {
      const { container } = render(<ScheduleColumn {...defaultProps} />);

      const columnDiv = container.firstChild as HTMLElement;
      expect(columnDiv).toHaveClass(
        "flex-1",
        "border",
        "border-gray-200",
        "shadow",
        "rounded-lg",
        "p-4",
        "bg-white",
        "relative",
      );
    });
  });

  describe("Refreshing State", () => {
    it("shows refreshing overlay when isRefreshing is true", () => {
      render(<ScheduleColumn {...defaultProps} isRefreshing={true} />);

      expect(screen.getAllByTestId("spinner").length).toBeGreaterThan(0);
      expect(
        screen.getByText(SCHEDULE_COLUMN_MESSAGES.refreshing),
      ).toBeInTheDocument();
    });

    it("applies opacity class when refreshing", () => {
      const { container } = render(
        <ScheduleColumn {...defaultProps} isRefreshing={true} />,
      );

      const columnDiv = container.firstChild as HTMLElement;
      expect(columnDiv).toHaveClass("opacity-75");
    });

    it("does not show refreshing overlay when isRefreshing is false", () => {
      render(<ScheduleColumn {...defaultProps} isRefreshing={false} />);

      const spinners = screen.queryAllByTestId("spinner");
      const overlaySpinners = spinners.filter(
        (el) => el.getAttribute("data-size") === "sm",
      );
      expect(overlaySpinners).toHaveLength(0);
      expect(
        screen.queryByText(SCHEDULE_COLUMN_MESSAGES.refreshing),
      ).not.toBeInTheDocument();
    });

    it("does not apply opacity class when not refreshing", () => {
      const { container } = render(
        <ScheduleColumn {...defaultProps} isRefreshing={false} />,
      );

      const columnDiv = container.firstChild as HTMLElement;
      expect(columnDiv).not.toHaveClass("opacity-75");
    });
  });

  describe("Schedule Items Display", () => {
    it("displays schedule item date correctly", () => {
      render(<ScheduleColumn {...defaultProps} />);

      expect(screen.getByText("Formatted 2024-01-15")).toBeInTheDocument();
    });

    it("displays patient count correctly - singular", () => {
      const singlePatientItem = {
        ...defaultScheduleItem,
        patients: [mockPatient1],
      };
      render(
        <ScheduleColumn {...defaultProps} scheduleItems={[singlePatientItem]} />,
      );

      expect(screen.getByText("1 patient scheduled")).toBeInTheDocument();
    });

    it("displays patient count correctly - plural", () => {
      render(<ScheduleColumn {...defaultProps} />);

      expect(screen.getByText("2 patients scheduled")).toBeInTheDocument();
    });

    it("shows collapsed state by default", () => {
      render(<ScheduleColumn {...defaultProps} />);

      const expandButton = rowExpandButtons()[0];
      expect(expandButton).toBeInTheDocument();
      expect(screen.queryByText("John Smith")).not.toBeInTheDocument();
    });

    it("shows expanded state when openScheduleIdx matches", () => {
      render(<ScheduleColumn {...defaultProps} openScheduleIdx={[0]} />);

      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Emily Williams")).toBeInTheDocument();
    });
  });

  describe("Interactive Behavior", () => {
    it("calls setOpenScheduleIdx with index appended when schedule row is expanded", () => {
      const setOpenScheduleIdxMock = jest.fn();
      render(
        <ScheduleColumn
          {...defaultProps}
          setOpenScheduleIdx={setOpenScheduleIdxMock}
        />,
      );

      fireEvent.click(rowExpandButtons()[0]);

      expect(setOpenScheduleIdxMock).toHaveBeenCalledWith([0]);
    });

    it("calls setOpenScheduleIdx with index removed when expanded row is collapsed", () => {
      const setOpenScheduleIdxMock = jest.fn();
      render(
        <ScheduleColumn
          {...defaultProps}
          openScheduleIdx={[0]}
          setOpenScheduleIdx={setOpenScheduleIdxMock}
        />,
      );

      const collapseButton = screen.getByRole("button", { expanded: true });
      fireEvent.click(collapseButton);

      expect(setOpenScheduleIdxMock).toHaveBeenCalledWith([]);
    });

    it("shows rotate arrow when expanded", () => {
      const { container } = render(
        <ScheduleColumn {...defaultProps} openScheduleIdx={[0]} />,
      );

      const arrow = container.querySelector(".rotate-90");
      expect(arrow).toBeInTheDocument();
    });

    it("does not show rotate arrow when collapsed", () => {
      const { container } = render(
        <ScheduleColumn {...defaultProps} openScheduleIdx={[]} />,
      );

      const arrow = container.querySelector(".rotate-90");
      expect(arrow).not.toBeInTheDocument();
    });
  });

  describe("Patient List Display", () => {
    beforeEach(() => {
      render(<ScheduleColumn {...defaultProps} openScheduleIdx={[0]} />);
    });

    it("displays patient names when expanded", () => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Emily Williams")).toBeInTheDocument();
    });

    it("does not show type tags on assessment column", () => {
      expect(
        screen.queryByTestId("attendance-type-tag"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Treatment column type tags", () => {
    it("displays attendance type tags for physiotherapy column", () => {
      const physiotherapyItem = {
        date: "2024-01-15",
        patients: [
          {
            id: "1",
            name: "John",
            attendanceId: 1,
            attendanceType: "physiotherapy" as AttendanceType,
          },
          {
            id: "1",
            name: "John",
            attendanceId: 2,
            attendanceType: "tens" as AttendanceType,
          },
        ],
      };
      render(
        <ScheduleColumn
          {...defaultProps}
          title="Treatments"
          columnType="physiotherapy"
          scheduleItems={[physiotherapyItem]}
          openScheduleIdx={[0]}
        />,
      );

      const tags = screen.getAllByTestId("attendance-type-tag");
      expect(tags).toHaveLength(2);
      expect(tags[0]).toHaveAttribute("data-type", "physiotherapy");
      expect(tags[1]).toHaveAttribute("data-type", "tens");
    });
  });

  describe("Manage / cancellation flow", () => {
    it("calls openCancellation when Manage is clicked for scheduled rows", () => {
      render(<ScheduleColumn {...defaultProps} openScheduleIdx={[0]} />);

      const manageButtons = screen.getAllByRole("button", {
        name: "Manage appointment",
      });
      fireEvent.click(manageButtons[0]);

      expect(mockOpenCancellation).toHaveBeenCalledWith(
        [100],
        "John Smith",
        "2024-01-15",
      );
    });

    it("does not show Manage for non-scheduled status", () => {
      const completedPatient = {
        ...mockPatient1,
        attendanceStatus: AttendanceStatus.COMPLETED,
      };
      render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={[{ date: "2024-01-15", patients: [completedPatient] }]}
          openScheduleIdx={[0]}
        />,
      );

      expect(
        screen.queryByRole("button", { name: "Manage appointment" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading spinner when isLoading is true and no schedule items", () => {
      render(
        <ScheduleColumn {...defaultProps} scheduleItems={[]} isLoading={true} />,
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(
        screen.getByText(SCHEDULE_COLUMN_MESSAGES.loading),
      ).toBeInTheDocument();
    });

    it("shows loading spinner with correct props", () => {
      render(
        <ScheduleColumn {...defaultProps} scheduleItems={[]} isLoading={true} />,
      );

      const spinner = screen.getByTestId("spinner");
      expect(spinner).toHaveAttribute("data-size", "md");
      expect(spinner).toHaveClass("text-blue-500");
    });
  });

  describe("Empty State", () => {
    it("shows assessment empty message when no items and columnType is assessment", () => {
      render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={[]}
          columnType="assessment"
        />,
      );

      expect(
        screen.getByText(SCHEDULE_COLUMN_MESSAGES.emptyAssessment),
      ).toBeInTheDocument();
      expect(
        screen.getByText(SCHEDULE_COLUMN_MESSAGES.emptyHint),
      ).toBeInTheDocument();
    });

    it("shows physiotherapy empty message when no items and columnType is physiotherapy", () => {
      render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={[]}
          columnType="physiotherapy"
        />,
      );

      expect(
        screen.getByText(SCHEDULE_COLUMN_MESSAGES.emptyPhysiotherapy),
      ).toBeInTheDocument();
      expect(
        screen.getByText(SCHEDULE_COLUMN_MESSAGES.emptyHint),
      ).toBeInTheDocument();
    });
  });

  describe("Multiple Schedule Items", () => {
    const multipleItems = [
      defaultScheduleItem,
      { date: "2024-01-16", patients: [mockPatient1] },
      { date: "2024-01-17", patients: [mockPatient2] },
    ];

    it("renders one expand-all control and one row toggle per date", () => {
      render(<ScheduleColumn {...defaultProps} scheduleItems={multipleItems} />);

      expect(
        screen.getByRole("button", {
          name: "Expand all appointments in column",
        }),
      ).toBeInTheDocument();
      expect(rowExpandButtons()).toHaveLength(3);
    });

    it("handles opening different schedule items independently", () => {
      const setOpenScheduleIdxMock = jest.fn();
      render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={multipleItems}
          setOpenScheduleIdx={setOpenScheduleIdxMock}
        />,
      );

      fireEvent.click(rowExpandButtons()[1]);

      expect(setOpenScheduleIdxMock).toHaveBeenCalledWith([1]);
    });

    it("shows correct styling for open vs closed items", () => {
      const { container } = render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={multipleItems}
          openScheduleIdx={[1]}
        />,
      );

      const scheduleBlocks = container.querySelectorAll(
        ".mb-4.border.border-gray-200.rounded-lg.shadow-sm",
      );
      expect(scheduleBlocks[0]).toHaveClass("bg-white");
      expect(scheduleBlocks[1]).toHaveClass("bg-gray-100");
      expect(scheduleBlocks[2]).toHaveClass("bg-white");
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes for expandable content", () => {
      render(<ScheduleColumn {...defaultProps} />);

      const button = rowExpandButtons()[0];
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute(
        "aria-controls",
        "schedule-patients-assessment-0",
      );
    });

    it("updates ARIA attributes when expanded", () => {
      render(<ScheduleColumn {...defaultProps} openScheduleIdx={[0]} />);

      const expandButton = screen.getByRole("button", { expanded: true });
      expect(expandButton).toHaveAttribute("aria-expanded", "true");
    });

    it("has proper id for controlled content", () => {
      render(<ScheduleColumn {...defaultProps} openScheduleIdx={[0]} />);

      const content = document.getElementById("schedule-patients-assessment-0");
      expect(content).toBeInTheDocument();
    });

    it("has aria-label for Manage buttons", () => {
      render(<ScheduleColumn {...defaultProps} openScheduleIdx={[0]} />);

      const manageButtons = screen.getAllByLabelText("Manage appointment");
      expect(manageButtons).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty patients array", () => {
      const emptySchedule = { date: "2024-01-15", patients: [] };
      render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={[emptySchedule]}
          openScheduleIdx={[0]}
        />,
      );

      expect(screen.getByText("0 patients scheduled")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Manage appointment" }),
      ).not.toBeInTheDocument();
    });

    it("handles patient without attendance type", () => {
      const patientWithoutType = {
        ...mockPatient1,
        attendanceType: undefined as unknown as AttendanceType,
      };
      const scheduleWithoutType = {
        ...defaultScheduleItem,
        patients: [patientWithoutType],
      };

      render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={[scheduleWithoutType]}
          openScheduleIdx={[0]}
        />,
      );

      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(
        screen.queryByTestId("attendance-type-tag"),
      ).not.toBeInTheDocument();
    });

    it("handles very long patient names", () => {
      const longNamePatient = {
        ...mockPatient1,
        name: "John Smith Miller Williams Taylor Davis",
      };
      const scheduleWithLongName = {
        ...defaultScheduleItem,
        patients: [longNamePatient],
      };

      render(
        <ScheduleColumn
          {...defaultProps}
          scheduleItems={[scheduleWithLongName]}
          openScheduleIdx={[0]}
        />,
      );

      expect(
        screen.getByText("John Smith Miller Williams Taylor Davis"),
      ).toBeInTheDocument();
    });
  });
});
