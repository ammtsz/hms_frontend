import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParentAppointmentSelector } from "../ParentAppointmentSelector";

describe("ParentAppointmentSelector", () => {
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
    selectedParentAppointment: "",
    parentAppointmentOptions: mockOptions,
    loadingParentOptions: false,
    isSubmitting: false,
    onParentAppointmentChange: jest.fn(),
  };
  const mockPropsWithStatusT = { ...mockProps, patientStatus: "T" as const };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render parent appointment selector with options when patient status is T", () => {
    render(<ParentAppointmentSelector {...mockPropsWithStatusT} />);

    expect(
      screen.getByText("Which complaint is this consultation related to? *"),
    ).toBeInTheDocument();
    expect(screen.getByText("2024-01-01 - Headache")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15 - Back pain")).toBeInTheDocument();
  });

  it("should show loading message when loading options", () => {
    render(
      <ParentAppointmentSelector {...mockProps} loadingParentOptions={true} />,
    );

    expect(
      screen.getByText("Loading previous consultations..."),
    ).toBeInTheDocument();
  });

  it("should show single-option dropdown when no options available (first appointment)", () => {
    render(
      <ParentAppointmentSelector {...mockProps} parentAppointmentOptions={[]} />,
    );

    expect(
      screen.getByText("First assessment consultation"),
    ).toBeInTheDocument();
  });

  it("should call onParentAppointmentChange when selection changes", () => {
    render(<ParentAppointmentSelector {...mockPropsWithStatusT} />);

    const select = screen.getByLabelText(
      "Which complaint is this consultation related to? *",
    );
    fireEvent.change(select, { target: { value: "1" } });

    expect(mockProps.onParentAppointmentChange).toHaveBeenCalledWith("1");
  });

  it("should show 'First assessment consultation' option when no parent options", () => {
    render(
      <ParentAppointmentSelector {...mockProps} parentAppointmentOptions={[]} />,
    );

    expect(
      screen.getByText("First assessment consultation"),
    ).toBeInTheDocument();
  });

  it("should disable select when submitting", () => {
    render(
      <ParentAppointmentSelector
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
      <ParentAppointmentSelector
        {...mockProps}
        parentAppointmentOptions={[]}
        patientStatus="D"
      />,
    );

    expect(screen.getByText("New complaint")).toBeInTheDocument();
  });

  it("should show 'New concern' when patient status is T and options empty", () => {
    render(
      <ParentAppointmentSelector
        {...mockProps}
        parentAppointmentOptions={[]}
        patientStatus="T"
      />,
    );

    expect(screen.getByText("New complaint")).toBeInTheDocument();
  });
});
