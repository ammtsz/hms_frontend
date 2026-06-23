import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusFilterButtons } from "../StatusFilterButtons";
import { StatusFilter } from "../hooks/useAttendanceHistory";

describe("StatusFilterButtons", () => {
  const defaultProps = {
    statusFilter: "all" as StatusFilter,
    onFilterChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all filter buttons", () => {
    render(<StatusFilterButtons {...defaultProps} />);

    expect(screen.getByRole("button", { name: /^All$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Completed$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Missed$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Cancelled$/i }),
    ).toBeInTheDocument();
  });

  it("should highlight active filter button - all", () => {
    render(<StatusFilterButtons {...defaultProps} statusFilter="all" />);

    const allButton = screen.getByRole("button", { name: /^All$/i });
    expect(allButton).toHaveClass("bg-blue-600", "text-white");
  });

  it("should highlight active filter button - completed", () => {
    render(<StatusFilterButtons {...defaultProps} statusFilter="completed" />);

    const completedButton = screen.getByRole("button", {
      name: /^Completed$/i,
    });
    expect(completedButton).toHaveClass("bg-green-600", "text-white");
  });

  it("should highlight active filter button - missed", () => {
    render(<StatusFilterButtons {...defaultProps} statusFilter="missed" />);

    const missedButton = screen.getByRole("button", { name: /^Missed$/i });
    expect(missedButton).toHaveClass("bg-red-600", "text-white");
  });

  it("should highlight active filter button - cancelled", () => {
    render(<StatusFilterButtons {...defaultProps} statusFilter="cancelled" />);

    const cancelledButton = screen.getByRole("button", {
      name: /^Cancelled$/i,
    });
    expect(cancelledButton).toHaveClass("bg-orange-600", "text-white");
  });

  it("should apply inactive styles to non-active buttons", () => {
    render(<StatusFilterButtons {...defaultProps} statusFilter="all" />);

    const completedButton = screen.getByRole("button", {
      name: /^Completed$/i,
    });
    expect(completedButton).toHaveClass("bg-gray-200", "text-gray-700");
  });

  it("should call onFilterChange with correct value when clicking todos", async () => {
    const user = userEvent.setup();
    render(<StatusFilterButtons {...defaultProps} />);

    const allButton = screen.getByRole("button", { name: /^All$/i });
    await user.click(allButton);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("all");
  });

  it("should call onFilterChange with correct value when clicking completed", async () => {
    const user = userEvent.setup();
    render(<StatusFilterButtons {...defaultProps} />);

    const completedButton = screen.getByRole("button", {
      name: /^Completed$/i,
    });
    await user.click(completedButton);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("completed");
  });

  it("should call onFilterChange with correct value when clicking missed", async () => {
    const user = userEvent.setup();
    render(<StatusFilterButtons {...defaultProps} />);

    const missedButton = screen.getByRole("button", { name: /^Missed$/i });
    await user.click(missedButton);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("missed");
  });

  it("should call onFilterChange with correct value when clicking cancelled", async () => {
    const user = userEvent.setup();
    render(<StatusFilterButtons {...defaultProps} />);

    const cancelledButton = screen.getByRole("button", {
      name: /^Cancelled$/i,
    });
    await user.click(cancelledButton);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("cancelled");
  });

  it("should render buttons in responsive grid layout", () => {
    const { container } = render(<StatusFilterButtons {...defaultProps} />);

    const buttonContainer = container.firstChild as HTMLElement;
    expect(buttonContainer).toHaveClass(
      "grid",
      "grid-cols-2",
      "gap-2",
      "mb-4",
      "sm:flex",
      "sm:flex-wrap",
    );
  });
});
