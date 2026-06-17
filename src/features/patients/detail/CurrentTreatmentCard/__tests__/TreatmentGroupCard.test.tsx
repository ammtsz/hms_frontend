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
  bodyLocation: "Cabeça",
  plannedSessions: 10,
  completedSessions: 3,
  status: "in_progress",
  durationMinutes: 30,
  color: "azul",
  sessions: [{ status: "scheduled" }, { status: "completed" }],
};

const mockTensGroup = {
  id: 2,
  treatmentType: "tens" as const,
  bodyLocation: "Ombro direito",
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

    expect(screen.getByText(/Cabeça/)).toBeInTheDocument();
    const colorBadge = screen.getByText("azul");
    expect(colorBadge).toBeInTheDocument();
    expect(colorBadge).toHaveStyle({
      backgroundColor: getColorCodeWithOpacity("azul", 0.25),
    });
    expect(screen.getByText(/30 unidades/)).toBeInTheDocument();
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

    expect(screen.getByText(/Ombro direito/)).toBeInTheDocument();
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

    const deleteButton = screen.getByTitle("Cancelar tratamento");
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith([1], "Fisioterapia");
  });

  it("disables delete button when isDeleting is true", () => {
    render(
      <TreatmentGroupCard
        group={mockPhysiotherapyGroup}
        onDelete={mockOnDelete}
        isDeleting={true}
      />,
    );

    const deleteButton = screen.getByTitle("Cancelar tratamento");
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

    expect(screen.getByText(/Local não especificado/)).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toHaveTextContent("0/1");
  });
});
