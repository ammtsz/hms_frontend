import { render, screen } from "@testing-library/react";
import { Checkbox, Field, Input, Radio, Select, Textarea } from "../index";

describe("form controls", () => {
  it("associates a field label with an input", () => {
    render(
      <Field label="Name" htmlFor="name">
        <Input id="name" />
      </Field>,
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("renders help text and error state", () => {
    render(
      <Field label="Phone" error="Invalid phone" helpText="Use area code">
        <Input invalid />
      </Field>,
    );

    expect(screen.getByText("Use area code")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid phone");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("renders select options", () => {
    render(
      <Select aria-label="Priority" defaultValue="1">
        <option value="1">Priority</option>
        <option value="2">Standard</option>
      </Select>,
    );

    expect(screen.getByRole("combobox")).toHaveValue("1");
  });

  it("renders a textarea", () => {
    render(<Textarea aria-label="Notes" defaultValue="No notes" />);

    expect(screen.getByRole("textbox")).toHaveValue("No notes");
  });

  it("renders checkbox and radio controls", () => {
    render(
      <>
        <Checkbox aria-label="Accept" defaultChecked />
        <Radio aria-label="Option" defaultChecked />
      </>,
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("radio")).toBeChecked();
  });
});
