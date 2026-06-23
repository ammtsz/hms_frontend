import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppointmentHistoryHeader } from "../AppointmentHistoryHeader";

describe("AppointmentHistoryHeader", () => {
  const defaultProps = {
    totalItems: 10,
    isCollapsed: false,
    loading: false,
    onToggleCollapse: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with total items count", () => {
    render(<AppointmentHistoryHeader {...defaultProps} />);

    expect(screen.getByText(/Appointment History/i)).toBeInTheDocument();
    expect(screen.getByText("(10)")).toBeInTheDocument();
  });

  it("should show refresh button when not loading and not collapsed", () => {
    render(<AppointmentHistoryHeader {...defaultProps} />);

    const refreshButton = screen.getByRole("button", { name: /^Refresh$/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it("should hide refresh button when collapsed", () => {
    render(<AppointmentHistoryHeader {...defaultProps} isCollapsed={true} />);

    const refreshButton = screen.queryByRole("button", { name: /^Refresh$/i });
    expect(refreshButton).not.toBeInTheDocument();
  });

  it("should hide refresh button when loading", () => {
    render(<AppointmentHistoryHeader {...defaultProps} loading={true} />);

    const refreshButton = screen.queryByRole("button", { name: /^Refresh$/i });
    expect(refreshButton).not.toBeInTheDocument();
  });

  it("should call onRefresh when refresh button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppointmentHistoryHeader {...defaultProps} />);

    const refreshButton = screen.getByRole("button", { name: /^Refresh$/i });
    await user.click(refreshButton);

    expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
  });

  it("should call onToggleCollapse when header title is clicked", async () => {
    const user = userEvent.setup();
    render(<AppointmentHistoryHeader {...defaultProps} />);

    await user.click(
      screen.getByRole("heading", { name: /Appointment History/i }),
    );

    expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("should show expand control when collapsed", () => {
    render(<AppointmentHistoryHeader {...defaultProps} isCollapsed={true} />);

    expect(screen.getByTitle("Expand")).toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
  });

  it("should show collapse control when expanded", () => {
    render(<AppointmentHistoryHeader {...defaultProps} isCollapsed={false} />);

    expect(screen.getByTitle("Collapse")).toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("should apply correct margin when not collapsed", () => {
    const { container } = render(
      <AppointmentHistoryHeader {...defaultProps} isCollapsed={false} />,
    );

    const headerDiv = container.querySelector(".mb-4");
    expect(headerDiv).toBeInTheDocument();
  });

  it("should not apply margin when collapsed", () => {
    const { container } = render(
      <AppointmentHistoryHeader {...defaultProps} isCollapsed={true} />,
    );

    const headerDiv = container.querySelector(".mb-4");
    expect(headerDiv).not.toBeInTheDocument();
  });
});
