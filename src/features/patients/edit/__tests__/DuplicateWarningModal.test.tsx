import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DuplicateWarningModal from "../DuplicateWarningModal";

describe("DuplicateWarningModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSaveAnyway = jest.fn();
  const mockDuplicates = [
    {
      id: "1",
      name: "John Smith",
      phone: "(11) 98765-4321",
      priority: "3",
      status: "T",
    },
    {
      id: "2",
      name: "John Williams",
      phone: "(11) 98765-4321",
      priority: "2",
      status: "N",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSaveAnyway: mockOnSaveAnyway,
    duplicatePatients: mockDuplicates,
    isSaving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(
      screen.getByText("Patient with similar information"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Check if a record for this patient already exists before saving.",
      ),
    ).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(<DuplicateWarningModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText("Patient with similar information"),
    ).not.toBeInTheDocument();
  });

  it("should display all duplicate patients", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("John Williams")).toBeInTheDocument();
    expect(screen.getAllByText("(11) 98765-4321")).toHaveLength(2);
  });

  it("should show patient IDs", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("should show patient status labels", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(screen.getByText("In Treatment")).toBeInTheDocument();
    expect(screen.getByText("New patient")).toBeInTheDocument();
  });

  it("should show 'No phone' for patients without phone", () => {
    const duplicatesWithoutPhone = [
      {
        id: "3",
        name: "Emily Williams",
        phone: "",
        priority: "3",
        status: "T",
      },
    ];

    render(
      <DuplicateWarningModal
        {...defaultProps}
        duplicatePatients={duplicatesWithoutPhone}
      />,
    );

    expect(screen.getByText("No phone")).toBeInTheDocument();
  });

  it("should render links to view patient profiles", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    const links = screen.getAllByText("View Profile →");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/patients/1");
    expect(links[1]).toHaveAttribute("href", "/patients/2");
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should call onClose when cancel button clicked", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", {
      name: /cancel and review/i,
    });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onSaveAnyway when save anyway button clicked", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    const saveButton = screen.getByRole("button", {
      name: /save anyway/i,
    });
    fireEvent.click(saveButton);

    expect(mockOnSaveAnyway).toHaveBeenCalledTimes(1);
  });

  it("should show loading state when saving", () => {
    render(<DuplicateWarningModal {...defaultProps} isSaving={true} />);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel and review/i }),
    ).toBeDisabled();
  });

  it("should handle empty duplicates array", () => {
    render(<DuplicateWarningModal {...defaultProps} duplicatePatients={[]} />);

    expect(screen.getByText("Similar Patients:")).toBeInTheDocument();
    // Should not crash with empty array
  });

  it("should display correct status text for all statuses", () => {
    const allStatuses = [
      { id: "1", name: "Test 1", phone: "", priority: "3", status: "N" },
      { id: "2", name: "Test 2", phone: "", priority: "3", status: "T" },
      { id: "3", name: "Test 3", phone: "", priority: "3", status: "D" },
      { id: "4", name: "Test 4", phone: "", priority: "3", status: "C" },
    ];

    render(
      <DuplicateWarningModal
        {...defaultProps}
        duplicatePatients={allStatuses}
      />,
    );

    expect(screen.getByText("New patient")).toBeInTheDocument();
    expect(screen.getByText("In Treatment")).toBeInTheDocument();
    expect(screen.getByText("Discharged")).toBeInTheDocument();
    expect(screen.getByText("Consecutive no-shows")).toBeInTheDocument();
  });

  it("should scroll when many duplicates are present", () => {
    const manyDuplicates = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Patient ${i}`,
      phone: `(11) 9876${i}-4321`,
      priority: "3",
      status: "T",
    }));

    render(
      <DuplicateWarningModal
        {...defaultProps}
        duplicatePatients={manyDuplicates}
      />,
    );

    const scrollableContainer = screen
      .getByText("Similar Patients:")
      .closest("div");
    expect(scrollableContainer).toHaveClass("max-h-64", "overflow-y-auto");
  });
});
