import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StepNavigation from "../components/StepNavigation";

describe("StepNavigation", () => {
  const defaultProps = {
    currentStep: "incomplete" as const,
    incompleteAttendancesCount: 0,
    scheduledAbsencesCount: 0,
  };

  it("renders all three steps", () => {
    render(<StepNavigation {...defaultProps} />);

    expect(screen.getByText("Atendimentos")).toBeInTheDocument();
    expect(screen.getByText("Faltas")).toBeInTheDocument();
    expect(screen.getByText("Confirmação")).toBeInTheDocument();
  });

  it("highlights current step correctly", () => {
    render(
      <StepNavigation
        {...defaultProps}
        currentStep="absences"
        scheduledAbsencesCount={1}
      />
    );

    const step2 = screen.getByText("2");
    expect(step2).toHaveClass("bg-blue-500", "text-white");
  });

  it("shows completed step when incomplete attendances is 0", () => {
    render(<StepNavigation {...defaultProps} incompleteAttendancesCount={0} />);

    const step1 = screen.getByText("1");
    expect(step1).toHaveClass("bg-green-500", "text-white");
  });

  it("shows pending step when there are incomplete attendances", () => {
    render(<StepNavigation {...defaultProps} incompleteAttendancesCount={2} />);

    const step1 = screen.getByText("1");
    expect(step1).toHaveClass("bg-blue-500", "text-white");
  });

  it("shows correct state for absences step when no scheduled absences", () => {
    render(
      <StepNavigation
        {...defaultProps}
        currentStep="incomplete"
        scheduledAbsencesCount={0}
      />
    );

    const step2 = screen.getByText("2");
    expect(step2).toHaveClass("bg-green-500", "text-white");
  });

  it("shows pending state for absences step when there are scheduled absences", () => {
    render(
      <StepNavigation
        {...defaultProps}
        currentStep="incomplete"
        scheduledAbsencesCount={2}
      />
    );

    const step2 = screen.getByText("2");
    expect(step2).toHaveClass("bg-gray-300", "text-gray-600");
  });

  it("shows confirm step as current when on confirm step", () => {
    render(
      <StepNavigation
        {...defaultProps}
        currentStep="confirm"
        incompleteAttendancesCount={0}
        scheduledAbsencesCount={0}
      />
    );

    const step3 = screen.getByText("3");
    expect(step3).toHaveClass("bg-blue-500", "text-white");
  });

  it("shows absences step as completed when on confirm step", () => {
    render(
      <StepNavigation
        {...defaultProps}
        currentStep="confirm"
        scheduledAbsencesCount={1}
      />
    );

    const step2 = screen.getByText("2");
    expect(step2).toHaveClass("bg-green-500", "text-white");
  });

  it("shows default pending state correctly", () => {
    render(
      <StepNavigation
        {...defaultProps}
        currentStep="incomplete"
        incompleteAttendancesCount={1}
        scheduledAbsencesCount={1}
      />
    );

    // Step 1 should be current (blue)
    const step1 = screen.getByText("1");
    expect(step1).toHaveClass("bg-blue-500", "text-white");

    // Step 2 should be pending (gray) since we're not on it and have absences
    const step2 = screen.getByText("2");
    expect(step2).toHaveClass("bg-gray-300", "text-gray-600");

    // Step 3 should be pending (gray)
    const step3 = screen.getByText("3");
    expect(step3).toHaveClass("bg-gray-300", "text-gray-600");
  });

  it("uses mobile-friendly vertical layout", () => {
    const { container } = render(<StepNavigation {...defaultProps} />);

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("flex-col", "sm:flex-row");
  });
});
