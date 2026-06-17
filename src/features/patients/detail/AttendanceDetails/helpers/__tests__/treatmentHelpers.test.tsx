import React from "react";
import { render, screen } from "@testing-library/react";
import { renderLocations, renderSessions, NotesBox } from "../treatmentHelpers";

describe("treatmentHelpers", () => {
  describe("renderLocations", () => {
    it("should render single location with singular label", () => {
      render(<div>{renderLocations(["Cabeça"])}</div>);

      expect(screen.getByText(/Local:/)).toBeInTheDocument();
      expect(screen.getByText(/Cabeça/)).toBeInTheDocument();
    });

    it("should render multiple locations with plural label", () => {
      render(<div>{renderLocations(["Cabeça", "Peito", "Pernas"])}</div>);

      expect(screen.getByText(/Locais:/)).toBeInTheDocument();
      expect(screen.getByText(/Cabeça, Peito, Pernas/)).toBeInTheDocument();
    });

    it("should handle empty array", () => {
      render(<div>{renderLocations([])}</div>);

      // Empty array still shows label but with empty location list
      expect(screen.getByText(/Local:/)).toBeInTheDocument();
    });
  });

  describe("renderSessions", () => {
    it("should render sessions when showSessions is true", () => {
      render(<div>{renderSessions("3/5", true)}</div>);

      expect(screen.getByText(/Sessões:/)).toBeInTheDocument();
      expect(screen.getByText("3/5")).toBeInTheDocument();
    });

    it("should use custom session label", () => {
      render(<div>{renderSessions("2/4", true, "Aplicações")}</div>);

      expect(screen.getByText(/Aplicações:/)).toBeInTheDocument();
      expect(screen.getByText("2/4")).toBeInTheDocument();
    });

    it("should return null when showSessions is false", () => {
      const result = renderSessions("3/5", false);

      expect(result).toBeNull();
    });

    it("should return null when sessions is undefined", () => {
      const result = renderSessions(undefined, true);

      expect(result).toBeNull();
    });
  });

  describe("NotesBox", () => {
    it("should render treatment notes with yellow border", () => {
      render(
        <NotesBox
          notes="Tratamento progredindo bem"
          noteType="treatment"
          borderColor="yellow"
        />,
      );

      expect(screen.getByText(/Notas do tratamento:/)).toBeInTheDocument();
      expect(
        screen.getByText("Tratamento progredindo bem"),
      ).toBeInTheDocument();
    });

    it("should render session notes with blue border", () => {
      const { container } = render(
        <NotesBox
          notes="Sessão concluída com sucesso"
          noteType="session"
          borderColor="blue"
        />,
      );

      expect(screen.getByText(/Notas da sessão:/)).toBeInTheDocument();
      expect(
        screen.getByText("Sessão concluída com sucesso"),
      ).toBeInTheDocument();

      const notesBox = container.querySelector(".border-blue-100");
      expect(notesBox).toBeInTheDocument();
    });

    it("should render assessment notes with purple border", () => {
      const { container } = render(
        <NotesBox
          notes="Orientações fornecidas"
          noteType="assessment"
          borderColor="purple"
        />,
      );

      expect(screen.getByText(/Notas da consulta:/)).toBeInTheDocument();

      const notesBox = container.querySelector(".border-purple-100");
      expect(notesBox).toBeInTheDocument();
    });

    it("should render pre-consultation notes", () => {
      render(
        <NotesBox
          notes="Paciente agendou retorno"
          noteType="pre-consultation"
          borderColor="purple"
        />,
      );

      expect(screen.getByText(/Notas pré-consulta:/)).toBeInTheDocument();
    });

    it("should apply disabled border when borderColor is disabled", () => {
      const { container } = render(
        <NotesBox
          notes="Tratamento cancelado"
          noteType="notes"
          borderColor="disabled"
        />,
      );

      const notesBox = container.querySelector(".border-gray-200");
      expect(notesBox).toBeInTheDocument();
    });

    it("should apply red border for error/warning notes", () => {
      const { container } = render(
        <NotesBox notes="Paciente faltou" noteType="notes" borderColor="red" />,
      );

      const notesBox = container.querySelector(".border-red-300");
      expect(notesBox).toBeInTheDocument();
    });

    it("should return null when notes is undefined", () => {
      const { container } = render(
        <NotesBox noteType="treatment" borderColor="yellow" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should return null when notes is empty string", () => {
      const { container } = render(
        <NotesBox notes="" noteType="treatment" borderColor="yellow" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should have correct CSS classes for styling", () => {
      const { container } = render(
        <NotesBox
          notes="Test note"
          noteType="treatment"
          borderColor="yellow"
        />,
      );

      const notesBox = container.firstChild as HTMLElement;
      expect(notesBox).toHaveClass(
        "flex",
        "flex-col",
        "border",
        "p-2",
        "rounded-md",
        "mt-2",
      );
    });
  });
});
