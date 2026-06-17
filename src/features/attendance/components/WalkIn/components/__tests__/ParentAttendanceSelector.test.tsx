import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParentAttendanceSelector } from "../ParentAttendanceSelector";

describe("ParentAttendanceSelector", () => {
  const mockOptions = [
    {
      id: 1,
      date: "2024-01-01",
      mainComplaint: "Headache",
      label: "2024-01-01 - Headache",
    },
    {
      id: 2,
      date: "2024-01-15",
      mainComplaint: "Back pain",
      label: "2024-01-15 - Back pain",
    },
  ];

  const mockProps = {
    selectedParentAttendance: "",
    parentAttendanceOptions: mockOptions,
    loadingParentOptions: false,
    isSubmitting: false,
    onParentAttendanceChange: jest.fn(),
  };
  const mockPropsWithStatusT = { ...mockProps, patientStatus: "T" as const };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render parent attendance selector with options when patient status is T", () => {
    render(<ParentAttendanceSelector {...mockPropsWithStatusT} />);

    expect(
      screen.getByText("Esta consulta está relacionada a qual queixa? *"),
    ).toBeInTheDocument();
    expect(screen.getByText("2024-01-01 - Headache")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15 - Back pain")).toBeInTheDocument();
  });

  it("should show loading message when loading options", () => {
    render(
      <ParentAttendanceSelector {...mockProps} loadingParentOptions={true} />,
    );

    expect(
      screen.getByText("Carregando consultas anteriores..."),
    ).toBeInTheDocument();
  });

  it("should show single-option dropdown when no options available (first attendance)", () => {
    render(
      <ParentAttendanceSelector {...mockProps} parentAttendanceOptions={[]} />,
    );

    expect(
      screen.getByText("Primeira consulta de avaliação"),
    ).toBeInTheDocument();
  });

  it("should call onParentAttendanceChange when selection changes", () => {
    render(<ParentAttendanceSelector {...mockPropsWithStatusT} />);

    const select = screen.getByLabelText(
      "Esta consulta está relacionada a qual queixa? *",
    );
    fireEvent.change(select, { target: { value: "1" } });

    expect(mockProps.onParentAttendanceChange).toHaveBeenCalledWith("1");
  });

  it("should show 'Primeira consulta' option when no parent options", () => {
    render(
      <ParentAttendanceSelector {...mockProps} parentAttendanceOptions={[]} />,
    );

    expect(
      screen.getByText("Primeira consulta de avaliação"),
    ).toBeInTheDocument();
  });

  it("should disable select when submitting", () => {
    render(
      <ParentAttendanceSelector
        {...mockPropsWithStatusT}
        isSubmitting={true}
      />,
    );

    const select = screen.getByLabelText(
      "Esta consulta está relacionada a qual queixa? *",
    );

    expect(select).toBeDisabled();
  });

  it("should show 'Nova queixa' when patient status is A and no options", () => {
    render(
      <ParentAttendanceSelector
        {...mockProps}
        parentAttendanceOptions={[]}
        patientStatus="A"
      />,
    );

    expect(screen.getByText("Nova queixa")).toBeInTheDocument();
  });

  it("should show 'Nova queixa' when patient status is T and options empty", () => {
    render(
      <ParentAttendanceSelector
        {...mockProps}
        parentAttendanceOptions={[]}
        patientStatus="T"
      />,
    );

    expect(screen.getByText("Nova queixa")).toBeInTheDocument();
  });
});
