import React from "react";
import { render } from "@testing-library/react";
import { Skeleton } from "../SkeletonLoading";

describe("Skeleton", () => {
  it("renders with default props", () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass(
      "animate-pulse",
      "bg-gray-200",
      "h-4",
      "w-full",
      "rounded"
    );
  });

  it("applies custom height", () => {
    const { container } = render(<Skeleton height="h-8" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("h-8");
  });

  it("applies custom width", () => {
    const { container } = render(<Skeleton width="w-32" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("w-32");
  });

  it("applies rounded-full when rounded prop is true", () => {
    const { container } = render(<Skeleton rounded />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("rounded-full");
    expect(skeleton).not.toHaveClass("rounded");
  });

  it("applies additional className", () => {
    const { container } = render(<Skeleton className="custom-class" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("custom-class");
  });

  it("combines all props correctly", () => {
    const { container } = render(
      <Skeleton height="h-12" width="w-64" rounded className="mb-4" />
    );

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass(
      "animate-pulse",
      "bg-gray-200",
      "h-12",
      "w-64",
      "rounded-full",
      "mb-4"
    );
  });
});
