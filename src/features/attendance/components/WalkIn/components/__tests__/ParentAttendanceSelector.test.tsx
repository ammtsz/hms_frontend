import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParentAttendanceSelector } from "../ParentAttendanceSelector";

describe("ParentAttendanceSelector", () => {
  const mockOptions = [
    {
      id: 1,
      date: "2024-01-01",
      mainConcern: "Headache",
      label: "2024-01-01 - Headache",
    },
    {
      id: 2,
      date: "2024-01-15",
      mainConcern: "Back pain",
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
      screen.getByText("Which complaint is this consultation related to? *"),
    ).toBeInTheDocument();
    expect(screen.getByText("2024-01-01 - Headache")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15 - Back pain")).toBeInTheDocument();
  });

  it("should show loading message when loading options", () => {
    render(
      <ParentAttendanceSelector {...mockProps} loadingParentOptions={true} />,
    );

    expect(
      screen.getByText("Loading previous consultations..."),
    ).toBeInTheDocument();
  });

  it("should show single-option dropdown when no options available (first attendance)", () => {
    render(
      <ParentAttendanceSelector {...mockProps} parentAttendanceOptions={[]} />,
    );

    expect(
      screen.getByText("First assessment consultation"),
    ).toBeInTheDocument();
  });

  it("should call onParentAttendanceChange when selection changes", () => {
    render(<ParentAttendanceSelector {...mockPropsWithStatusT} />);

    const select = screen.getByLabelText(
      "Which complaint is this consultation related to? *",
    );
    fireEvent.change(select, { target: { value: "1" } });

    expect(mockProps.onParentAttendanceChange).toHaveBeenCalledWith("1");
  });

  it("should show 'First assessment consultation' option when no parent options", () => {
    render(
      <ParentAttendanceSelector {...mockProps} parentAttendanceOptions={[]} />,
    );

    expect(
      screen.getByText("First assessment consultation"),
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
      "Which complaint is this consultation related to? *",
    );

    expect(select).toBeDisabled();
  });

  it("should show 'New concern' when patient status is A and no options", () => {
    render(
      <ParentAttendanceSelector
        {...mockProps}
        parentAttendanceOptions={[]}
        patientStatus="A"
      />,
    );

    expect(screen.getByText("New complaint")).toBeInTheDocument();
  });

  it("should show 'New concern' when patient status is T and options empty", () => {
    render(
      <ParentAttendanceSelector
        {...mockProps}
        parentAttendanceOptions={[]}
        patientStatus="T"
      />,
    );

    expect(screen.getByText("New complaint")).toBeInTheDocument();
  });
});
