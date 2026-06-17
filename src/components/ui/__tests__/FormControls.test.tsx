import { render, screen } from "@testing-library/react";
import { Checkbox, Field, Input, Radio, Select, Textarea } from "../index";

describe("form controls", () => {
  it("associates a field label with an input", () => {
    render(
      <Field label="Nome" htmlFor="name">
        <Input id="name" />
      </Field>,
    );

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });

  it("renders help text and error state", () => {
    render(
      <Field label="Telefone" error="Telefone inválido" helpText="Use DDD">
        <Input invalid />
      </Field>,
    );

    expect(screen.getByText("Use DDD")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Telefone inválido");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("renders select options", () => {
    render(
      <Select aria-label="Prioridade" defaultValue="1">
        <option value="1">Emergência</option>
        <option value="2">Intermediário</option>
      </Select>,
    );

    expect(screen.getByRole("combobox")).toHaveValue("1");
  });

  it("renders a textarea", () => {
    render(<Textarea aria-label="Observações" defaultValue="Sem observações" />);

    expect(screen.getByRole("textbox")).toHaveValue("Sem observações");
  });

  it("renders checkbox and radio controls", () => {
    render(
      <>
        <Checkbox aria-label="Aceitar" defaultChecked />
        <Radio aria-label="Opção" defaultChecked />
      </>,
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("radio")).toBeChecked();
  });
});
