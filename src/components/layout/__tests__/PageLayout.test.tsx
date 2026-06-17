import { render, screen } from "@testing-library/react";
import { PageHeader, PageToolbar } from "../index";

describe("PageHeader", () => {
  it("renders title and description", () => {
    render(
      <PageHeader
        title="Pacientes"
        description="Gerencie pacientes"
      />,
    );

    expect(screen.getByText("Pacientes")).toBeInTheDocument();
    expect(screen.getByText("Gerencie pacientes")).toBeInTheDocument();
  });

  it("renders actions", () => {
    render(
      <PageHeader
        title="Agenda"
        actions={<button type="button">Novo</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Novo" })).toBeInTheDocument();
  });

  it("uses mobile-safe layout classes", () => {
    const { container } = render(
      <PageHeader title="Test" actions={<span>Action</span>} />,
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("flex-col", "sm:flex-row");
  });
});

describe("PageToolbar", () => {
  it("renders children with wrap layout", () => {
    render(
      <PageToolbar>
        <button type="button">Filter</button>
      </PageToolbar>,
    );

    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
  });
});
