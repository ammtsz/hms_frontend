import { fireEvent, render, screen } from "@testing-library/react";
import { Badge, Card, CardBody, CardHeader, SectionDisclosure } from "../index";

describe("Card, Badge, and SectionDisclosure", () => {
  it("renders card regions", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardBody>Content</CardBody>
      </Card>,
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders badge variants", () => {
    render(<Badge variant="success">Active</Badge>);

    expect(screen.getByText("Active")).toHaveClass("bg-green-50");
  });

  it("toggles a disclosure section", () => {
    const onToggle = jest.fn();

    render(
      <SectionDisclosure title="Priorities" isOpen={false} onToggle={onToggle}>
        Internal content
      </SectionDisclosure>,
    );

    const button = screen.getByRole("button", { name: "Priorities" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Internal content")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
