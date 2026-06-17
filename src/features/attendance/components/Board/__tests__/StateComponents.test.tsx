import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LoadingState, ErrorState } from "../StateComponents";

describe("StateComponents", () => {
  describe("LoadingState", () => {
    it("renders with default message", () => {
      render(<LoadingState />);

      expect(
        screen.getByText("Carregando atendimentos...")
      ).toBeInTheDocument();
    });

    it("renders with custom message", () => {
      render(<LoadingState message="Carregando dados do paciente..." />);

      expect(
        screen.getByText("Carregando dados do paciente...")
      ).toBeInTheDocument();
    });

    it("has correct styling", () => {
      const { container } = render(<LoadingState />);

      const loadingDiv = container.firstChild as HTMLElement;
      expect(loadingDiv).toHaveClass(
        "flex",
        "items-center",
        "justify-center",
        "h-64"
      );

      const textElement = screen.getByText("Carregando atendimentos...");
      expect(textElement).toHaveClass("text-lg");
    });

    it("centers content properly", () => {
      render(<LoadingState />);

      const textElement = screen.getByText("Carregando atendimentos...");
      const container = textElement.parentElement;

      expect(container).toHaveClass("flex", "items-center", "justify-center");
    });
  });

  describe("ErrorState", () => {
    const mockOnRetry = jest.fn();
    const defaultProps = {
      error: "Erro de conexão com o servidor",
      onRetry: mockOnRetry,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("renders with required props", () => {
      render(<ErrorState {...defaultProps} />);

      expect(
        screen.getByText("Erro ao carregar atendimentos")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Erro de conexão com o servidor")
      ).toBeInTheDocument();
      expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
    });

    it("renders with custom retry button text", () => {
      render(
        <ErrorState {...defaultProps} retryButtonText="Recarregar dados" />
      );

      expect(screen.getByText("Recarregar dados")).toBeInTheDocument();
      expect(screen.queryByText("Tentar novamente")).not.toBeInTheDocument();
    });

    it("calls onRetry when retry button is clicked", () => {
      render(<ErrorState {...defaultProps} />);

      const retryButton = screen.getByText("Tentar novamente");
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it("calls onRetry when custom retry button is clicked", () => {
      render(
        <ErrorState {...defaultProps} retryButtonText="Recarregar dados" />
      );

      const retryButton = screen.getByText("Recarregar dados");
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it("has correct container styling", () => {
      const { container } = render(<ErrorState {...defaultProps} />);

      const errorDiv = container.firstChild as HTMLElement;
      expect(errorDiv).toHaveClass(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "h-64",
        "gap-4"
      );
    });

    it("has correct title styling", () => {
      render(<ErrorState {...defaultProps} />);

      const title = screen.getByText("Erro ao carregar atendimentos");
      expect(title).toHaveClass("text-lg", "text-red-600");
    });

    it("has correct error message styling", () => {
      render(<ErrorState {...defaultProps} />);

      const errorMessage = screen.getByText("Erro de conexão com o servidor");
      expect(errorMessage).toHaveClass("text-sm");
    });

    it("has correct button styling", () => {
      render(<ErrorState {...defaultProps} />);

      const button = screen.getByText("Tentar novamente");
      expect(button).toHaveClass("px-4", "py-2", "text-white", "rounded-md");
    });

    it("button has hover state styling", () => {
      render(<ErrorState {...defaultProps} />);

      const button = screen.getByText("Tentar novamente");
      expect(button).toHaveClass("hover:bg-blue-800");
    });

    it("handles empty error message", () => {
      const { container } = render(
        <ErrorState error="" onRetry={mockOnRetry} />
      );

      expect(
        screen.getByText("Erro ao carregar atendimentos")
      ).toBeInTheDocument();
      expect(screen.getByText("Tentar novamente")).toBeInTheDocument();

      // Check that error div exists with correct classes
      const errorDiv = container.querySelector(
        ".text-sm.text-\\[color\\:var\\(--text-muted\\)\\]"
      );
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveTextContent("");
    });

    it("handles long error messages", () => {
      const longError =
        "Este é um erro muito longo que pode quebrar o layout se não for tratado adequadamente pelo componente";

      render(<ErrorState error={longError} onRetry={mockOnRetry} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
      expect(
        screen.getByText("Erro ao carregar atendimentos")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("LoadingState has proper text hierarchy", () => {
      render(<LoadingState />);

      const text = screen.getByText("Carregando atendimentos...");
      expect(text).toHaveClass("text-lg");
    });

    it("ErrorState has proper button semantics", () => {
      const mockOnRetry = jest.fn();
      render(<ErrorState error="Test error" onRetry={mockOnRetry} />);

      const button = screen.getByRole("button", { name: "Tentar novamente" });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it("ErrorState shows error hierarchy correctly", () => {
      const mockOnRetry = jest.fn();
      render(<ErrorState error="Test error" onRetry={mockOnRetry} />);

      const title = screen.getByText("Erro ao carregar atendimentos");
      const error = screen.getByText("Test error");

      // Title should be more prominent (text-lg vs text-sm)
      expect(title).toHaveClass("text-lg");
      expect(error).toHaveClass("text-sm");
    });
  });

  describe("Component Structure", () => {
    it("LoadingState has single container div", () => {
      const { container } = render(<LoadingState />);

      expect(container.children).toHaveLength(1);
      expect(container.firstChild).toHaveProperty("tagName", "DIV");
    });

    it("ErrorState has correct element structure", () => {
      const mockOnRetry = jest.fn();
      const { container } = render(
        <ErrorState error="Test error" onRetry={mockOnRetry} />
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.children).toHaveLength(3); // title, error message, button

      const [title, error, button] = Array.from(mainDiv.children);
      expect(title).toHaveProperty("tagName", "DIV");
      expect(error).toHaveProperty("tagName", "DIV");
      expect(button).toHaveProperty("tagName", "BUTTON");
    });
  });
});
