import React from "react";
import { render, screen } from "@testing-library/react";
import { AttendanceMetadata } from "../AttendanceMetadata";

describe("AttendanceMetadata", () => {
  describe("Created Date Display", () => {
    it("should always display created date in DD/MM/YYYY format", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-10T14:30:00.000Z"
        />,
      );

      expect(screen.getByText("Criado em:")).toBeInTheDocument();
      expect(screen.getByText("10/02/2026")).toBeInTheDocument();
    });

    it("should extract date correctly from different ISO datetime formats", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-01-05"
          updatedDate="2026-01-05T08:00:00Z"
        />,
      );

      expect(screen.getByText("05/01/2026")).toBeInTheDocument();
    });
  });

  describe("Updated Date Display", () => {
    it("should display updated date when different from created date", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-15T16:45:00.000Z"
        />,
      );

      expect(screen.getByText("Criado em:")).toBeInTheDocument();
      expect(screen.getByText("10/02/2026")).toBeInTheDocument();
      expect(screen.getByText("Atualizado em:")).toBeInTheDocument();
      expect(screen.getByText("15/02/2026")).toBeInTheDocument();
    });

    it("should NOT display updated date when same as created date", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-10" // Same day, different time
        />,
      );

      expect(screen.getByText("Criado em:")).toBeInTheDocument();
      expect(screen.queryByText("Atualizado em:")).not.toBeInTheDocument();
    });

    it("should compare dates ignoring time component", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-10" // Same date, different time
        />,
      );

      // Updated date should NOT appear because dates are the same
      expect(screen.queryByText("Atualizado em:")).not.toBeInTheDocument();
    });
  });

  describe("Cancelled Date Display", () => {
    it("should display cancelled date when provided", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-15"
          cancelledDate="2026-02-18"
        />,
      );

      expect(screen.getByText("Cancelado em:")).toBeInTheDocument();
      expect(screen.getByText("18/02/2026")).toBeInTheDocument();
    });

    it("should NOT display cancelled date when not provided", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-10"
        />,
      );

      expect(screen.queryByText("Cancelado em:")).not.toBeInTheDocument();
    });

    it("should format cancelled date from YYYY-MM-DD to DD/MM/YYYY", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-10"
          cancelledDate="2026-02-18"
        />,
      );

      expect(screen.getByText("18/02/2026")).toBeInTheDocument();
    });
  });

  describe("Complete Metadata Display", () => {
    it("should display all created and cancelled dates when all conditions are met", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-15"
          cancelledDate="2026-02-18"
        />,
      );

      // All three should be present
      expect(screen.getByText("Criado em:")).toBeInTheDocument();
      expect(screen.getByText("10/02/2026")).toBeInTheDocument();
      expect(screen.getByText("Atualizado em:")).toBeInTheDocument();
      expect(screen.getByText("15/02/2026")).toBeInTheDocument();
      expect(screen.getByText("Cancelado em:")).toBeInTheDocument();
      expect(screen.getByText("18/02/2026")).toBeInTheDocument();
    });

    it("should only show created and cancelled when not updated", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-10" // Same date as created
          cancelledDate="2026-02-11"
        />,
      );

      // Created and cancelled should be present
      expect(screen.getByText("Criado em:")).toBeInTheDocument();
      expect(screen.getByText("10/02/2026")).toBeInTheDocument();
      expect(screen.getByText("Cancelado em:")).toBeInTheDocument();
      expect(screen.getByText("11/02/2026")).toBeInTheDocument();
      // Updated should NOT be present (same as created)
      expect(screen.queryByText("Atualizado em:")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have correct CSS classes for styling", () => {
      const { container } = render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-15"
          cancelledDate="2026-02-18"
        />,
      );

      const metadataDiv = container.firstChild as HTMLElement;
      expect(metadataDiv).toHaveClass(
        "mt-3",
        "pt-3",
        "border-t",
        "border-gray-200",
        "text-xs",
        "text-gray-600",
        "space-y-1",
      );
    });

    it("should have font-medium class on labels", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-02-10"
          updatedDate="2026-02-10"
        />,
      );

      const criadoLabel = screen.getByText("Criado em:");
      expect(criadoLabel).toHaveClass("font-medium");
    });
  });

  describe("Edge Cases", () => {
    it("should handle leap year dates correctly", () => {
      render(
        <AttendanceMetadata
          createdDate="2024-02-29"
          updatedDate="2024-02-29"
        />,
      );

      expect(screen.getByText("29/02/2024")).toBeInTheDocument();
    });

    it("should handle year boundaries correctly", () => {
      render(
        <AttendanceMetadata
          createdDate="2025-12-31"
          updatedDate="2026-01-01"
        />,
      );

      expect(screen.getByText("31/12/2025")).toBeInTheDocument();
      expect(screen.getByText("Atualizado em:")).toBeInTheDocument();
      expect(screen.getByText("01/01/2026")).toBeInTheDocument();
    });

    it("should handle single-digit months and days with leading zeros", () => {
      render(
        <AttendanceMetadata
          createdDate="2026-03-05"
          updatedDate="2026-03-07"
          cancelledDate="2026-03-08"
        />,
      );

      expect(screen.getByText("05/03/2026")).toBeInTheDocument();
      expect(screen.getByText("08/03/2026")).toBeInTheDocument();
    });
  });
});
