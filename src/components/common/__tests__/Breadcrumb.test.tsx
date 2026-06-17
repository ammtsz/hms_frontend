import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Breadcrumb from "../Breadcrumb";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

// Mock lucide-react
jest.mock("lucide-react", () => ({
  ChevronRight: ({ className }: { size?: number; className?: string }) => (
    <span data-testid="chevron-right" className={className}>
      &gt;
    </span>
  ),
}));

describe("Breadcrumb", () => {
  const mockItems = [
    { label: "Home", href: "/" },
    { label: "Pacientes", href: "/patients" },
    { label: "Cadastro de Paciente", isActive: true },
  ];

  it("should render all breadcrumb items", () => {
    render(<Breadcrumb items={mockItems} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Pacientes")).toBeInTheDocument();
    expect(screen.getByText("Cadastro de Paciente")).toBeInTheDocument();
  });

  it("should render links for non-active items with href", () => {
    render(<Breadcrumb items={mockItems} />);

    const homeLink = screen.getByText("Home").closest("a");
    const patientsLink = screen.getByText("Pacientes").closest("a");

    expect(homeLink).toHaveAttribute("href", "/");
    expect(patientsLink).toHaveAttribute("href", "/patients");
  });

  it("should not render link for active item", () => {
    render(<Breadcrumb items={mockItems} />);

    const activeItem = screen.getByText("Cadastro de Paciente");
    expect(activeItem.closest("a")).toBeNull();
    expect(activeItem).toHaveClass("text-gray-900", "font-medium");
  });

  it("should render chevron separators between items", () => {
    render(<Breadcrumb items={mockItems} />);

    const chevrons = screen.getAllByTestId("chevron-right");
    // Should have 2 chevrons for 3 items (n-1)
    expect(chevrons).toHaveLength(2);
  });

  it("should apply custom className", () => {
    render(<Breadcrumb items={mockItems} className="custom-class" />);

    const breadcrumb = screen.getByRole("navigation");
    expect(breadcrumb).toHaveClass("custom-class");
  });

  it("should handle single item breadcrumb", () => {
    const singleItem = [{ label: "Single Page", isActive: true }];
    render(<Breadcrumb items={singleItem} />);

    expect(screen.getByText("Single Page")).toBeInTheDocument();
    expect(screen.queryByTestId("chevron-right")).not.toBeInTheDocument();
  });

  it("should handle items without href", () => {
    const itemsWithoutHref = [
      { label: "Home", href: "/" },
      { label: "Category" }, // No href, no isActive
      { label: "Current Page", isActive: true },
    ];
    render(<Breadcrumb items={itemsWithoutHref} />);

    const categoryItem = screen.getByText("Category");
    expect(categoryItem.closest("a")).toBeNull();
    expect(categoryItem).toHaveClass("text-gray-600");
  });

  it("should have proper accessibility attributes", () => {
    render(<Breadcrumb items={mockItems} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Breadcrumb");
  });

  it("should apply hover styles to links", () => {
    render(<Breadcrumb items={mockItems} />);

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveClass(
      "hover:text-blue-600",
      "transition-colors",
      "duration-200"
    );
  });
});
