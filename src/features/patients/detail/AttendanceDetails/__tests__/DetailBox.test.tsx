import React from "react";
import { render, screen } from "@testing-library/react";
import { DetailBox } from "../DetailBox";

describe("DetailBox", () => {
  it("should render children content", () => {
    render(<DetailBox>Test content</DetailBox>);

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should apply info variant styles by default", () => {
    const { container } = render(<DetailBox>Content</DetailBox>);

    const box = container.firstChild as HTMLElement;
    expect(box).toHaveClass("bg-gray-50", "border-gray-200");
  });

  it("should apply physiotherapy variant styles", () => {
    const { container } = render(
      <DetailBox variant="physiotherapy">Content</DetailBox>,
    );

    const box = container.firstChild as HTMLElement;
    expect(box).toHaveClass("border-l-yellow-500", "bg-white");
  });

  it("should apply tens variant styles", () => {
    const { container } = render(<DetailBox variant="tens">Content</DetailBox>);

    const box = container.firstChild as HTMLElement;
    expect(box).toHaveClass("border-l-blue-500", "bg-white");
  });

  it("should apply assessment variant styles", () => {
    const { container } = render(
      <DetailBox variant="assessment">Content</DetailBox>,
    );

    const box = container.firstChild as HTMLElement;
    expect(box).toHaveClass("border-l-purple-500", "bg-white");
  });

  it("should apply notes variant styles", () => {
    const { container } = render(
      <DetailBox variant="notes">Content</DetailBox>,
    );

    const box = container.firstChild as HTMLElement;
    expect(box).toHaveClass("bg-white", "border-gray-200");
  });

  it("should apply disabled variant styles", () => {
    const { container } = render(
      <DetailBox variant="disabled">Content</DetailBox>,
    );

    const box = container.firstChild as HTMLElement;
    expect(box).toHaveClass("border-l-gray-400", "opacity-80");
  });

  it("should apply custom className alongside variant styles", () => {
    const { container } = render(
      <DetailBox variant="physiotherapy" className="custom-class">
        Content
      </DetailBox>,
    );

    const box = container.firstChild as HTMLElement;
    expect(box).toHaveClass("custom-class", "border-l-yellow-500");
  });

  it("should render complex children with React elements", () => {
    render(
      <DetailBox>
        <div>Title</div>
        <p>Description</p>
      </DetailBox>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});
