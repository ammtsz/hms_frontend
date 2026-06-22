import React from "react";
import { render, screen } from "@testing-library/react";
import { renderLocations, renderSessions, NotesBox } from "../treatmentHelpers";

describe("treatmentHelpers", () => {
  describe("renderLocations", () => {
    it("should render single location with singular label", () => {
      render(<div>{renderLocations(["Head"])}</div>);

      expect(screen.getByText(/Location:/)).toBeInTheDocument();
      expect(screen.getByText(/Head/)).toBeInTheDocument();
    });

    it("should render multiple locations with plural label", () => {
      render(<div>{renderLocations(["Head", "Chest", "Legs"])}</div>);

      expect(screen.getByText(/Locations:/)).toBeInTheDocument();
      expect(screen.getByText(/Head, Chest, Legs/)).toBeInTheDocument();
    });

    it("should handle empty array", () => {
      render(<div>{renderLocations([])}</div>);

      // Empty array still shows label but with empty location list
      expect(screen.getByText(/Location:/)).toBeInTheDocument();
    });
  });

  describe("renderSessions", () => {
    it("should render sessions when showSessions is true", () => {
      render(<div>{renderSessions("3/5", true)}</div>);

      expect(screen.getByText(/Sessions:/)).toBeInTheDocument();
      expect(screen.getByText("3/5")).toBeInTheDocument();
    });

    it("should use custom session label", () => {
      render(<div>{renderSessions("2/4", true, "Applications")}</div>);

      expect(screen.getByText(/Applications:/)).toBeInTheDocument();
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
          notes="Treatment progressing well"
          noteType="treatment"
          borderColor="yellow"
        />,
      );

      expect(screen.getByText(/Treatment notes:/)).toBeInTheDocument();
      expect(
        screen.getByText("Treatment progressing well"),
      ).toBeInTheDocument();
    });

    it("should render session notes with blue border", () => {
      const { container } = render(
        <NotesBox
          notes="Session completed successfully"
          noteType="session"
          borderColor="blue"
        />,
      );

      expect(screen.getByText(/Session notes:/)).toBeInTheDocument();
      expect(
        screen.getByText("Session completed successfully"),
      ).toBeInTheDocument();

      const notesBox = container.querySelector(".border-blue-100");
      expect(notesBox).toBeInTheDocument();
    });

    it("should render assessment notes with purple border", () => {
      const { container } = render(
        <NotesBox
          notes="Instructions provided"
          noteType="assessment"
          borderColor="purple"
        />,
      );

      expect(screen.getByText(/Assessment notes:/)).toBeInTheDocument();

      const notesBox = container.querySelector(".border-purple-100");
      expect(notesBox).toBeInTheDocument();
    });

    it("should render pre-consultation notes", () => {
      render(
        <NotesBox
          notes="Patient scheduled follow-up"
          noteType="pre-consultation"
          borderColor="purple"
        />,
      );

      expect(screen.getByText(/Pre-consultation notes:/)).toBeInTheDocument();
    });

    it("should apply disabled border when borderColor is disabled", () => {
      const { container } = render(
        <NotesBox
          notes="Treatment cancelled"
          noteType="notes"
          borderColor="disabled"
        />,
      );

      const notesBox = container.querySelector(".border-gray-200");
      expect(notesBox).toBeInTheDocument();
    });

    it("should apply red border for error/warning notes", () => {
      const { container } = render(
        <NotesBox notes="Patient missed appointment" noteType="notes" borderColor="red" />,
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
