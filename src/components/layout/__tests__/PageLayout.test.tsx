import { render, screen } from "@testing-library/react";
import { PageHeader, PageToolbar } from "../index";

describe("PageHeader", () => {
  it("renders title and description", () => {
    render(<PageHeader title="Patients" description="Manage patients" />);

    expect(screen.getByText("Patients")).toBeInTheDocument();
    expect(screen.getByText("Manage patients")).toBeInTheDocument();
  });

  it("renders actions", () => {
    render(
      <PageHeader
        title="Schedule"
        actions={<button type="button">New</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
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
