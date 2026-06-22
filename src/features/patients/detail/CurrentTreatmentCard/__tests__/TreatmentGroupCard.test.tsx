import React from "react";
import { getColorCodeWithOpacity } from "@/utils/treatmentColors";
import { render, screen, fireEvent } from "@/utils/testUtils";
import { TreatmentGroupCard } from "../TreatmentGroupCard";

jest.mock("../../CurrentTreatmentCard/TreatmentProgressBar", () => ({
  TreatmentProgressBar: ({
    completed,
    total,
  }: {
    completed: number;
    total: number;
  }) => (
    <div data-testid="progress-bar">
      {completed}/{total}
    </div>
  ),
}));

const mockPhysiotherapyGroup = {
  id: 1,
  treatmentType: "physiotherapy" as const,
  bodyLocation: "Head",
  plannedSessions: 10,
  completedSessions: 3,
  status: "in_progress",
  durationMinutes: 30,
  color: "blue",
  sessions: [{ status: "scheduled" }, { status: "completed" }],
};

const mockTensGroup = {
  id: 2,
  treatmentType: "tens" as const,
  bodyLocation: "Right Ankle",
  plannedSessions: 5,
  completedSessions: 2,
  status: "in_progress",
};

describe("TreatmentGroupCard", () => {
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders physiotherapy treatment group correctly", () => {
    render(
      <TreatmentGroupCard
        group={mockPhysiotherapyGroup}
        onDelete={mockOnDelete}
        isDeleting={false}
      />,
    );

    expect(screen.getByText(/Head/)).toBeInTheDocument();
    const colorBadge = screen.getByText("blue");
    expect(colorBadge).toBeInTheDocument();
    expect(colorBadge).toHaveStyle({
      backgroundColor: getColorCodeWithOpacity("blue", 0.25),
    });
    expect(screen.getByText(/30 minutes/)).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toHaveTextContent("3/10");
  });

  it("renders tens treatment group correctly", () => {
    render(
      <TreatmentGroupCard
        group={mockTensGroup}
        onDelete={mockOnDelete}
        isDeleting={false}
      />,
    );

    expect(screen.getByText(/Right Ankle/)).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toHaveTextContent("2/5");
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <TreatmentGroupCard
        group={mockPhysiotherapyGroup}
        onDelete={mockOnDelete}
        isDeleting={false}
      />,
    );

    const deleteButton = screen.getByTitle("Cancel treatment");
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith([1], "Physiotherapy");
  });

  it("disables delete button when isDeleting is true", () => {
    render(
      <TreatmentGroupCard
        group={mockPhysiotherapyGroup}
        onDelete={mockOnDelete}
        isDeleting={true}
      />,
    );

    const deleteButton = screen.getByTitle("Cancel treatment");
    expect(deleteButton).toBeDisabled();
  });

  it("handles group without optional fields", () => {
    const minimalGroup = {
      id: 3,
      treatmentType: "tens" as const,
      bodyLocation: "",
      plannedSessions: 1,
      completedSessions: 0,
      status: "scheduled",
    };

    render(
      <TreatmentGroupCard
        group={minimalGroup}
        onDelete={mockOnDelete}
        isDeleting={false}
      />,
    );

    expect(screen.getByText(/not specified/)).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toHaveTextContent("0/1");
  });
});
