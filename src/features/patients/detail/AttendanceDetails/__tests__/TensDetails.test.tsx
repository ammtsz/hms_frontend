import React from "react";
import { render, screen } from "@testing-library/react";
import { TensDetails } from "../TensDetails";

describe("TensDetails", () => {
  const defaultProps = {
    bodyLocations: ["Pé direito", "Joelho esquerdo"],
  };

  it("should render tens title", () => {
    render(<TensDetails {...defaultProps} />);

    expect(screen.getByText(/TENS/)).toBeInTheDocument();
  });

  it("should display body locations correctly", () => {
    render(<TensDetails {...defaultProps} />);

    expect(screen.getByText(/Locais:/)).toBeInTheDocument();
    expect(screen.getByText(/Pé direito, Joelho esquerdo/)).toBeInTheDocument();
  });

  it("should display single body location with singular label", () => {
    render(<TensDetails bodyLocations={["Pé direito"]} />);

    expect(screen.getByText(/Local:/)).toBeInTheDocument();
    expect(screen.getByText("Pé direito")).toBeInTheDocument();
  });

  it("should display sessions when showSessions is true", () => {
    render(
      <TensDetails {...defaultProps} sessionNumber="3/5" showSessions={true} />,
    );

    expect(screen.getByText(/Sessões:/)).toBeInTheDocument();
    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
  });

  it("should use custom session label", () => {
    render(
      <TensDetails
        {...defaultProps}
        sessionNumber="2/4"
        showSessions={true}
        sessionLabel="Aplicações"
      />,
    );

    expect(screen.getByText(/Aplicações:/)).toBeInTheDocument();
  });

  it("should not display sessions when showSessions is false", () => {
    render(
      <TensDetails
        {...defaultProps}
        sessionNumber="3/5"
        showSessions={false}
      />,
    );

    expect(screen.queryByText(/Sessões:/)).not.toBeInTheDocument();
  });

  it("should display notes when provided", () => {
    render(
      <TensDetails
        {...defaultProps}
        notes="Paciente sentiu melhora no joelho"
      />,
    );

    expect(screen.getByText(/Notas do tratamento:/)).toBeInTheDocument();
    expect(
      screen.getByText("Paciente sentiu melhora no joelho"),
    ).toBeInTheDocument();
  });

  it("should not display notes when not provided", () => {
    render(<TensDetails {...defaultProps} />);

    expect(screen.queryByText(/Notas do tratamento:/)).not.toBeInTheDocument();
  });

  it("should apply disabled styling when isAbsent is true", () => {
    const { container } = render(
      <TensDetails {...defaultProps} isAbsent={true} />,
    );

    const detailBox = container.querySelector(".border-l-gray-400");
    expect(detailBox).toBeInTheDocument();
  });

  it("should apply tens styling when isAbsent is false", () => {
    const { container } = render(
      <TensDetails {...defaultProps} isAbsent={false} />,
    );

    const detailBox = container.querySelector(".border-l-blue-500");
    expect(detailBox).toBeInTheDocument();
  });

  it("should render all properties together", () => {
    render(
      <TensDetails
        bodyLocations={["Pé direito", "Joelho", "Coluna"]}
        sessionNumber="4/6"
        showSessions={true}
        sessionLabel="Tratamentos"
        notes="Paciente apresenta evolução positiva"
        isAbsent={false}
      />,
    );

    expect(screen.getByText(/TENS/)).toBeInTheDocument();
    expect(screen.getByText(/Pé direito, Joelho, Coluna/)).toBeInTheDocument();
    expect(screen.getByText(/Tratamentos:/)).toBeInTheDocument();
    expect(screen.getByText(/4\/6/)).toBeInTheDocument();
    expect(
      screen.getByText("Paciente apresenta evolução positiva"),
    ).toBeInTheDocument();
  });

  it("should handle empty body locations array", () => {
    render(<TensDetails bodyLocations={[]} />);

    // Should still render with empty locations
    expect(screen.getByText(/TENS/)).toBeInTheDocument();
  });
});
