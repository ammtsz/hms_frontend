import { render, screen, fireEvent } from "@testing-library/react";
import Switch from "../Switch";

describe("Switch Component", () => {
  const defaultProps = {
    checked: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic functionality", () => {
    it("should render correctly", () => {
      render(<Switch {...defaultProps} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it("should be checked when checked prop is true", () => {
      render(<Switch {...defaultProps} checked={true} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("should call onChange when clicked", () => {
      const onChange = jest.fn();
      render(<Switch {...defaultProps} onChange={onChange} />);

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("should be disabled when disabled prop is true", () => {
      render(<Switch {...defaultProps} disabled={true} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });
  });

  describe("Label functionality", () => {
    it("should render with label when provided", () => {
      render(<Switch {...defaultProps} label="Test Label" />);

      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("should render label on the left when labelPosition is left", () => {
      render(
        <Switch {...defaultProps} label="Test Label" labelPosition="left" />
      );

      const container = screen.getByText("Test Label").parentElement;
      expect(container).toHaveClass("flex");
    });

    it("should toggle when label is clicked", () => {
      const onChange = jest.fn();
      render(
        <Switch {...defaultProps} onChange={onChange} label="Test Label" />
      );

      const label = screen.getByText("Test Label");
      fireEvent.click(label);

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Size variations", () => {
    it("should render small size correctly", () => {
      render(<Switch {...defaultProps} size="sm" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("should render large size correctly", () => {
      render(<Switch {...defaultProps} size="lg" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe("Custom styling", () => {
    it("should apply custom className", () => {
      render(<Switch {...defaultProps} className="custom-class" />);

      const container = screen
        .getByRole("checkbox")
        .closest("div")?.parentElement;
      expect(container).toHaveClass("custom-class");
    });
  });
});
