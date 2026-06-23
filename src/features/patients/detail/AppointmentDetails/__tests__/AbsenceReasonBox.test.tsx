import React from "react";
import { render, screen } from "@testing-library/react";
import { AbsenceReasonBox } from "../AbsenceReasonBox";

describe("AbsenceReasonBox", () => {
  it("renders nothing when status is 'none' and reason is empty", () => {
    const { container } = render(<AbsenceReasonBox status="none" reason="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders notes when status is 'none' but reason has text", () => {
    render(<AbsenceReasonBox status="none" reason="Some observation" />);
    expect(screen.getByText("Notes:")).toBeInTheDocument();
    expect(screen.getByText("Some observation")).toBeInTheDocument();
  });

  it("renders fallback text when reason is empty", () => {
    render(<AbsenceReasonBox status="missed" reason="" />);
    expect(screen.getByText("Reason:")).toBeInTheDocument();
    expect(screen.getByText("Not justified")).toBeInTheDocument();
  });

  it("renders missed reason with correct styling", () => {
    const { container } = render(
      <AbsenceReasonBox
        status="missed"
        reason="Patient was sick"
        isJustified={false}
      />,
    );

    expect(screen.getByText("Reason:")).toBeInTheDocument();
    expect(screen.getByText("Patient was sick")).toBeInTheDocument();

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv?.className).toContain("bg-red-100");
    expect(outerDiv?.className).toContain("border-red-500");
  });

  it("renders justified missed reason with correct label", () => {
    render(
      <AbsenceReasonBox
        status="missed"
        reason="Medical emergency"
        isJustified={true}
      />,
    );

    expect(screen.getByText("Justified absence:")).toBeInTheDocument();
    expect(screen.getByText("Medical emergency")).toBeInTheDocument();
  });

  it("renders cancelled reason with correct styling", () => {
    const { container } = render(
      <AbsenceReasonBox
        status="cancelled"
        reason="Patient requested cancellation"
      />,
    );

    expect(screen.getByText("Reason:")).toBeInTheDocument();
    expect(
      screen.getByText("Patient requested cancellation"),
    ).toBeInTheDocument();

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv?.className).toContain("bg-orange-100");
    expect(outerDiv?.className).toContain("border-orange-500");
  });

  it("renders info icon", () => {
    const { container } = render(
      <AbsenceReasonBox status="missed" reason="Reason text" />,
    );

    // Check for lucide-react Info icon (it renders as svg)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
