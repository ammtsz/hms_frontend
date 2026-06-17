import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageError } from "../PageError";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe("PageError", () => {
  const defaultProps = {
    error: "Erro de teste",
  };

  it("renders error message", () => {
    render(<PageError {...defaultProps} />);

    expect(screen.getByText("Erro de teste")).toBeInTheDocument();
    expect(screen.getByText("Ops! Algo deu errado")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(<PageError {...defaultProps} title="Título personalizado" />);

    expect(screen.getByText("Título personalizado")).toBeInTheDocument();
  });

  it("shows retry button when reset function is provided", () => {
    const mockReset = jest.fn();
    render(<PageError {...defaultProps} reset={mockReset} />);

    const retryButton = screen.getByText("Tentar Novamente");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("shows back button with default props", () => {
    render(<PageError {...defaultProps} />);

    const backButton = screen.getByText("Voltar para Pacientes");
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest("a")).toHaveAttribute("href", "/patients");
  });

  it("shows custom back button", () => {
    render(
      <PageError
        {...defaultProps}
        backHref="/custom"
        backLabel="Voltar Customizado"
      />
    );

    const backButton = screen.getByText("Voltar Customizado");
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest("a")).toHaveAttribute("href", "/custom");
  });

  it("hides back button when showBackButton is false", () => {
    render(<PageError {...defaultProps} showBackButton={false} />);

    expect(screen.queryByText("Voltar para Pacientes")).not.toBeInTheDocument();
  });

  it("shows both retry and back buttons when both are enabled", () => {
    const mockReset = jest.fn();
    render(<PageError {...defaultProps} reset={mockReset} />);

    expect(screen.getByText("Tentar Novamente")).toBeInTheDocument();
    expect(screen.getByText("Voltar para Pacientes")).toBeInTheDocument();
  });
});
