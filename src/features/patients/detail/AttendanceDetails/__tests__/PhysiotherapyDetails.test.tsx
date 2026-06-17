import React from "react";
import { render, screen } from "@testing-library/react";
import { PhysiotherapyDetails } from "../PhysiotherapyDetails";

describe("PhysiotherapyDetails", () => {
  const defaultProps = {
    bodyLocations: ["Cabeça", "Peito"],
  };

  it("should render physiotherapy title", () => {
    render(<PhysiotherapyDetails {...defaultProps} />);

    expect(screen.getByText(/Fisioterapia/)).toBeInTheDocument();
  });

  it("should display body locations correctly", () => {
    render(<PhysiotherapyDetails {...defaultProps} />);

    expect(screen.getByText(/Locais:/)).toBeInTheDocument();
    expect(screen.getByText(/Cabeça, Peito/)).toBeInTheDocument();
  });

  it("should display single body location without plural", () => {
    render(<PhysiotherapyDetails bodyLocations={["Cabeça"]} />);

    expect(screen.getByText(/Local:/)).toBeInTheDocument();
    expect(screen.getByText("Cabeça")).toBeInTheDocument();
  });

  it("should display color when provided", () => {
    render(<PhysiotherapyDetails {...defaultProps} color="Azul" />);

    expect(screen.getByText("Azul")).toBeInTheDocument();
  });

  it("should show distinct color badges and per-location lowercase colors when multiple colors", () => {
    render(
      <PhysiotherapyDetails
        bodyLocationsWithColors={[
          { bodyLocation: "Coronário", color: "Branco" },
          { bodyLocation: "Abdômen", color: "Azul" },
        ]}
      />,
    );

    expect(screen.getByText("Branco")).toBeInTheDocument();
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(
      screen.getByText(/Coronário \(branco\), Abdômen \(azul\)/),
    ).toBeInTheDocument();
  });

  it("should display duration in singular when 1 unit", () => {
    render(<PhysiotherapyDetails {...defaultProps} duration={1} />);

    expect(screen.getByText(/1 unidade/)).toBeInTheDocument();
  });

  it("should display duration in plural when multiple units", () => {
    render(<PhysiotherapyDetails {...defaultProps} duration={15} />);

    expect(screen.getByText(/15 unidades/)).toBeInTheDocument();
  });

  it("should display sessions when showSessions is true", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        sessionNumber="2/5"
        showSessions={true}
      />,
    );

    expect(screen.getByText(/Sessão:/)).toBeInTheDocument();
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
  });

  it("should use custom session label", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        sessionNumber="3/10"
        showSessions={true}
        sessionLabel="Sessões programadas"
      />,
    );

    expect(screen.getByText(/Sessões programadas:/)).toBeInTheDocument();
  });

  it("should not display sessions when showSessions is false", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        sessionNumber="2/5"
        showSessions={false}
      />,
    );

    expect(screen.queryByText(/Sessão:/)).not.toBeInTheDocument();
  });

  it("should display notes when provided", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        notes="Paciente reagiu bem ao tratamento"
      />,
    );

    expect(screen.getByText(/Notas do tratamento:/)).toBeInTheDocument();
    expect(
      screen.getByText("Paciente reagiu bem ao tratamento"),
    ).toBeInTheDocument();
  });

  it("should not display notes when not provided", () => {
    render(<PhysiotherapyDetails {...defaultProps} />);

    expect(screen.queryByText(/Notas do tratamento:/)).not.toBeInTheDocument();
  });

  it("should apply disabled styling when isAbsent is true", () => {
    const { container } = render(
      <PhysiotherapyDetails {...defaultProps} isAbsent={true} />,
    );

    const detailBox = container.querySelector(".border-l-gray-400");
    expect(detailBox).toBeInTheDocument();
  });

  it("should apply physiotherapy styling when isAbsent is false", () => {
    const { container } = render(
      <PhysiotherapyDetails {...defaultProps} isAbsent={false} />,
    );

    const detailBox = container.querySelector(".border-l-yellow-500");
    expect(detailBox).toBeInTheDocument();
  });

  it("should render all properties together", () => {
    render(
      <PhysiotherapyDetails
        bodyLocations={["Cabeça", "Peito", "Pernas"]}
        color="Azul"
        duration={20}
        sessionNumber="3/5"
        showSessions={true}
        notes="Tratamento progredindo bem"
        isAbsent={false}
      />,
    );

    expect(screen.getByText(/Fisioterapia/)).toBeInTheDocument();
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.getByText(/Cabeça, Peito, Pernas/)).toBeInTheDocument();
    expect(screen.getByText(/20 unidades/)).toBeInTheDocument();
    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
    expect(screen.getByText("Tratamento progredindo bem")).toBeInTheDocument();
  });
});
