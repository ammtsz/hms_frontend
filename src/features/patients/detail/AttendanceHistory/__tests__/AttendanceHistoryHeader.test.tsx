import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttendanceHistoryHeader } from "../AttendanceHistoryHeader";

describe("AttendanceHistoryHeader", () => {
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
    render(<AttendanceHistoryHeader {...defaultProps} />);

    expect(screen.getByText(/Histórico de Atendimentos/i)).toBeInTheDocument();
    expect(screen.getByText("(10)")).toBeInTheDocument();
  });

  it("should show refresh button when not loading and not collapsed", () => {
    render(<AttendanceHistoryHeader {...defaultProps} />);

    const refreshButton = screen.getByRole("button", { name: /atualizar/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it("should hide refresh button when collapsed", () => {
    render(<AttendanceHistoryHeader {...defaultProps} isCollapsed={true} />);

    const refreshButton = screen.queryByRole("button", { name: /atualizar/i });
    expect(refreshButton).not.toBeInTheDocument();
  });

  it("should hide refresh button when loading", () => {
    render(<AttendanceHistoryHeader {...defaultProps} loading={true} />);

    const refreshButton = screen.queryByRole("button", { name: /atualizar/i });
    expect(refreshButton).not.toBeInTheDocument();
  });

  it("should call onRefresh when refresh button is clicked", async () => {
    const user = userEvent.setup();
    render(<AttendanceHistoryHeader {...defaultProps} />);

    const refreshButton = screen.getByRole("button", { name: /atualizar/i });
    await user.click(refreshButton);

    expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
  });

  it("should call onToggleCollapse when header title is clicked", async () => {
    const user = userEvent.setup();
    render(<AttendanceHistoryHeader {...defaultProps} />);

    await user.click(
      screen.getByRole("heading", { name: /histórico de atendimentos/i }),
    );

    expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("should show expand control when collapsed", () => {
    render(<AttendanceHistoryHeader {...defaultProps} isCollapsed={true} />);

    expect(screen.getByTitle("Expandir")).toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
  });

  it("should show collapse control when expanded", () => {
    render(<AttendanceHistoryHeader {...defaultProps} isCollapsed={false} />);

    expect(screen.getByTitle("Recolher")).toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("should apply correct margin when not collapsed", () => {
    const { container } = render(
      <AttendanceHistoryHeader {...defaultProps} isCollapsed={false} />,
    );

    const headerDiv = container.querySelector(".mb-4");
    expect(headerDiv).toBeInTheDocument();
  });

  it("should not apply margin when collapsed", () => {
    const { container } = render(
      <AttendanceHistoryHeader {...defaultProps} isCollapsed={true} />,
    );

    const headerDiv = container.querySelector(".mb-4");
    expect(headerDiv).not.toBeInTheDocument();
  });
});
