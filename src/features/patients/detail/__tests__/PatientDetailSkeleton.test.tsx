import React from "react";
import { render } from "@testing-library/react";
import { PatientDetailSkeleton } from "../PatientDetailSkeleton";

describe("PatientDetailSkeleton", () => {
  it("renders skeleton loading state", () => {
    render(<PatientDetailSkeleton />);

    // Should render the main skeleton structure
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders cards by default", () => {
    const { container } = render(<PatientDetailSkeleton />);

    // Should have multiple skeleton cards using the Card primitive classes
    const skeletonCards = container.querySelectorAll(
      ".rounded-lg.border.border-gray-200.bg-white",
    );
    expect(skeletonCards.length).toBeGreaterThan(1);
  });

  it("can hide cards when showCards is false", () => {
    const { container } = render(<PatientDetailSkeleton showCards={false} />);

    // Should only have the header card, not the detailed cards
    const skeletonCards = container.querySelectorAll(
      ".rounded-lg.border.border-gray-200.bg-white",
    );
    expect(skeletonCards.length).toBe(1); // Only header card
  });

  it("renders header card skeleton structure", () => {
    const { container } = render(<PatientDetailSkeleton />);

    // Should have header card with name, badges, metadata, and complaint skeletons
    expect(container.querySelector(".h-8.w-48")).toBeInTheDocument(); // Name skeleton
    expect(container.querySelector(".h-4.w-28")).toBeInTheDocument(); // Complaint label skeleton
  });

  it("renders left column cards", () => {
    const { container } = render(<PatientDetailSkeleton />);

    // Should have left column with multiple cards
    const leftColumn = container.querySelector(".lg\\:col-span-2");
    expect(leftColumn).toBeInTheDocument();

    // Should have multiple cards in left column
    const cardsInLeftColumn = leftColumn?.querySelectorAll(
      ".rounded-lg.border.border-gray-200.bg-white",
    );
    expect(cardsInLeftColumn?.length).toBe(3); // Current treatment, history, future appointments
  });

  it("renders right column cards", () => {
    const { container } = render(<PatientDetailSkeleton />);

    // Should have right column cards
    const rightColumnCards = container.querySelectorAll(
      ".space-y-6 .rounded-lg.border.border-gray-200.bg-white",
    );
    expect(rightColumnCards.length).toBeGreaterThan(1);
  });

  it("renders list item skeletons", () => {
    const { container } = render(<PatientDetailSkeleton />);

    // Should have skeleton list items (for appointment history and future appointments)
    const listItems = container.querySelectorAll(".p-4.bg-gray-50.rounded-lg");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("has proper responsive layout structure", () => {
    const { container } = render(<PatientDetailSkeleton />);

    // Should have responsive grid layout
    expect(
      container.querySelector(".grid.grid-cols-1.lg\\:grid-cols-3")
    ).toBeInTheDocument();
  });
});
