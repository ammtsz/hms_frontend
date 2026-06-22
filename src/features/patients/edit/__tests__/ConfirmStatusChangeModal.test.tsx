import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmStatusChangeModal from "../ConfirmStatusChangeModal";
import type { PendingStatusChange } from "@/features/patients/form/hooks/useEditPatientForm";

jest.mock("@/components/common/BaseModal", () => {
  return function MockBaseModal({
    children,
    isOpen,
    title,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    title: string;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="base-modal">
        <h2>{title}</h2>
        {children}
      </div>
    );
  };
});

describe("ConfirmStatusChangeModal", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const pendingDischarge: PendingStatusChange = {
    newStatus: "A",
    openCount: 2,
  };

  const pendingMissed: PendingStatusChange = {
    newStatus: "F",
    openCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when pendingStatusChange is null", () => {
    const { container } = render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={null}
        isSaving={false}
      />,
    );

    expect(screen.queryByTestId("base-modal")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with Discharged title and content when newStatus is A", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingDischarge}
        isSaving={false}
      />,
    );

    expect(
      screen.getByText("Confirm change to Discharged"),
    ).toBeInTheDocument();
    expect(screen.getByText(/When changing to/i)).toBeInTheDocument();
    expect(
      screen.getByText(/all open appointments \(scheduled/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/This patient has/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Do you want to continue?")).toBeInTheDocument();
  });

  it("renders modal with Missed — consecutive title when newStatus is F", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingMissed}
        isSaving={false}
      />,
    );

    expect(
      screen.getByText("Confirm change to Missed — consecutive"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/will be cancelled/).length).toBeGreaterThan(0);
  });

  it("uses singular open appointment when openCount is 1", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingMissed}
        isSaving={false}
      />,
    );

    expect(screen.getAllByText(/open appointment/).length).toBeGreaterThan(0);
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingDischarge}
        isSaving={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when Yes, change status button is clicked", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingDischarge}
        isSaving={false}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /yes, change status/i }),
    );

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("disables buttons when isSaving is true", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingDischarge}
        isSaving={true}
      />,
    );

    expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
    const confirmButton = screen.getByRole("button", { name: /saving/i });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveTextContent("Saving...");
  });
});
