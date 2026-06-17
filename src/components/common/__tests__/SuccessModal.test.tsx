import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SuccessModal from "../SuccessModal";

describe("SuccessModal", () => {
  const defaultProps = {
    isOpen: true,
    message: "Operation completed successfully!",
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing when isOpen is false", () => {
    const { container } = render(
      <SuccessModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render modal when isOpen is true", () => {
    render(<SuccessModal {...defaultProps} />);
    expect(
      screen.getByText("Operation completed successfully!"),
    ).toBeInTheDocument();
  });

  it("should display default title", () => {
    render(<SuccessModal {...defaultProps} />);
    expect(screen.getByText("Sucesso!")).toBeInTheDocument();
  });

  it("should display custom title when provided", () => {
    render(<SuccessModal {...defaultProps} title="Custom Title" />);
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("should display the provided message", () => {
    render(<SuccessModal {...defaultProps} message="Custom success message" />);
    expect(screen.getByText("Custom success message")).toBeInTheDocument();
  });

  it("should display default confirm button label", () => {
    render(<SuccessModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("should display custom confirm button label when provided", () => {
    render(<SuccessModal {...defaultProps} confirmLabel="Continue" />);
    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });

  it("should call onConfirm when confirm button is clicked", () => {
    const onConfirm = jest.fn();
    render(<SuccessModal {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", { name: "OK" });
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should render success icon", () => {
    const { container } = render(<SuccessModal {...defaultProps} />);
    // Check for the CheckCircle icon (react-feather renders as SVG)
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
  });

  it("should have autoFocus on confirm button", () => {
    render(<SuccessModal {...defaultProps} />);
    const confirmButton = screen.getByRole("button", { name: "OK" });
    // Check that the button has the autoFocus attribute in the DOM
    expect(
      confirmButton.hasAttribute("autoFocus") ||
        document.activeElement === confirmButton,
    ).toBe(true);
  });

  it("should apply correct styling classes", () => {
    const { container } = render(<SuccessModal {...defaultProps} />);

    // Check for modal backdrop
    const backdrop = container.querySelector(".fixed.inset-0.z-50");
    expect(backdrop).toBeInTheDocument();

    // Check for modal content container
    const modalContent = container.querySelector(
      ".bg-white.rounded-lg.shadow-xl",
    );
    expect(modalContent).toBeInTheDocument();
    expect(modalContent).toHaveAttribute("role", "dialog");
  });
});
