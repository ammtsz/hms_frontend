import { fireEvent, render, screen } from "@testing-library/react";
import { Badge, Card, CardBody, CardHeader, SectionDisclosure } from "../index";

describe("Card, Badge, and SectionDisclosure", () => {
  it("renders card regions", () => {
    render(
      <Card>
        <CardHeader>Cabeçalho</CardHeader>
        <CardBody>Conteúdo</CardBody>
      </Card>,
    );

    expect(screen.getByText("Cabeçalho")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("renders badge variants", () => {
    render(<Badge variant="success">Ativo</Badge>);

    expect(screen.getByText("Ativo")).toHaveClass("bg-green-50");
  });

  it("toggles a disclosure section", () => {
    const onToggle = jest.fn();

    render(
      <SectionDisclosure title="Prioridades" isOpen={false} onToggle={onToggle}>
        Conteúdo interno
      </SectionDisclosure>,
    );

    const button = screen.getByRole("button", { name: "Prioridades" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Conteúdo interno")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
