import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormDateInput } from "../FormDateInput";
import { Field } from "../Field";

function ControlledFormDateInput({
  initialValue = "",
}: {
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <Field label="Date of Birth" htmlFor="birthDate">
      <FormDateInput
        id="birthDate"
        value={value}
        onValueChange={setValue}
      />
    </Field>
  );
}

describe("FormDateInput", () => {
  it("renders ISO value as MM/DD/YYYY", () => {
    render(
      <Field label="Date of Birth" htmlFor="birthDate">
        <FormDateInput id="birthDate" value="1990-05-15" />
      </Field>,
    );

    expect(screen.getByLabelText("Date of Birth")).toHaveValue("05/15/1990");
  });

  it("emits ISO when a complete valid date is entered", () => {
    const onValueChange = jest.fn();
    render(
      <Field label="Date of Birth" htmlFor="birthDate">
        <FormDateInput id="birthDate" value="" onValueChange={onValueChange} />
      </Field>,
    );

    fireEvent.change(screen.getByLabelText("Date of Birth"), {
      target: { value: "05151990" },
    });

    expect(onValueChange).toHaveBeenCalledWith("1990-05-15");
    expect(screen.getByLabelText("Date of Birth")).toHaveValue("05/15/1990");
  });

  it("emits empty string while incomplete", () => {
    const onValueChange = jest.fn();
    render(
      <Field label="Date of Birth" htmlFor="birthDate">
        <FormDateInput id="birthDate" value="" onValueChange={onValueChange} />
      </Field>,
    );

    fireEvent.change(screen.getByLabelText("Date of Birth"), {
      target: { value: "0515" },
    });

    expect(onValueChange).toHaveBeenCalledWith("");
    expect(screen.getByLabelText("Date of Birth")).toHaveValue("05/15");
  });

  it("keeps invalid calendar display without emitting ISO", () => {
    const onValueChange = jest.fn();
    render(
      <Field label="Date of Birth" htmlFor="birthDate">
        <FormDateInput id="birthDate" value="" onValueChange={onValueChange} />
      </Field>,
    );

    fireEvent.change(screen.getByLabelText("Date of Birth"), {
      target: { value: "02311990" },
    });

    expect(onValueChange).toHaveBeenCalledWith("");
    expect(screen.getByLabelText("Date of Birth")).toHaveValue("02/31/1990");
  });

  it("syncs display when parent value changes externally", () => {
    const { rerender } = render(
      <Field label="Date of Birth" htmlFor="birthDate">
        <FormDateInput id="birthDate" value="" />
      </Field>,
    );

    expect(screen.getByLabelText("Date of Birth")).toHaveValue("");

    rerender(
      <Field label="Date of Birth" htmlFor="birthDate">
        <FormDateInput id="birthDate" value="1990-01-01" />
      </Field>,
    );

    expect(screen.getByLabelText("Date of Birth")).toHaveValue("01/01/1990");
  });

  it("preserves partial typing when parent receives empty ISO", () => {
    render(<ControlledFormDateInput />);

    const input = screen.getByLabelText("Date of Birth");
    fireEvent.change(input, { target: { value: "05" } });

    expect(input).toHaveValue("05");
  });
});
