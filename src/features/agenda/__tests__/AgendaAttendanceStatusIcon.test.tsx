import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgendaAttendanceStatusIcon, {
  AGENDA_STATUS_LEGEND_ITEMS,
} from "../components/AgendaAttendanceStatusIcon";
import { AttendanceStatus } from "@/api/types";

jest.mock("lucide-react", () => {
  const Stub = ({
    className,
    ...rest
  }: {
    className?: string;
    "aria-hidden"?: boolean;
  }) => (
    <svg data-testid="lucide-stub" className={className} {...rest} />
  );
  return {
    Calendar: Stub,
    CheckCircle2: Stub,
    CircleX: Stub,
    Clock: Stub,
    UserCheck: Stub,
    UserX: Stub,
  };
});

describe("AgendaAttendanceStatusIcon", () => {
  it("renders an icon for each attendance status", () => {
    const { rerender } = render(
      <AgendaAttendanceStatusIcon status={AttendanceStatus.SCHEDULED} />,
    );
    expect(screen.getByTestId("lucide-stub")).toBeInTheDocument();

    rerender(
      <AgendaAttendanceStatusIcon status={AttendanceStatus.COMPLETED} />,
    );
    expect(screen.getByTestId("lucide-stub")).toBeInTheDocument();
  });

  it("merges custom className with status color classes", () => {
    const { container } = render(
      <AgendaAttendanceStatusIcon
        status={AttendanceStatus.SCHEDULED}
        className="h-4 w-4"
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-4", "w-4", "text-blue-600");
  });
});

describe("AGENDA_STATUS_LEGEND_ITEMS", () => {
  it("includes one entry per AttendanceStatus value", () => {
    const statuses = new Set(
      AGENDA_STATUS_LEGEND_ITEMS.map((item) => item.status),
    );
    expect(statuses.size).toBe(AGENDA_STATUS_LEGEND_ITEMS.length);
    Object.values(AttendanceStatus).forEach((s) => {
      expect(statuses.has(s)).toBe(true);
    });
  });

  it("has non-empty labels", () => {
    AGENDA_STATUS_LEGEND_ITEMS.forEach(({ label }) => {
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });
});
