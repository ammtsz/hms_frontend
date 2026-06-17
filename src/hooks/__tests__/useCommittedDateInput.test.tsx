import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useCommittedDateInput } from "../useCommittedDateInput";

function CommittedDateInputFixture({
  value,
  onCommit,
  debounceMs,
}: {
  value: string;
  onCommit: (date: string) => void;
  debounceMs?: number;
}) {
  const {
    draftValue,
    inputRef,
    handleDraftChange,
    handleKeyDown,
    handleBlur,
    handleMouseDown,
  } = useCommittedDateInput({ value, onCommit, debounceMs });

  return (
    <input
      ref={inputRef}
      type="date"
      aria-label="date"
      value={draftValue}
      onChange={(event) => handleDraftChange(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
    />
  );
}

describe("useCommittedDateInput", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("syncs draft when committed value changes externally", () => {
    const onCommit = jest.fn();
    const { rerender } = render(
      <CommittedDateInputFixture value="2025-01-15" onCommit={onCommit} />,
    );

    expect(screen.getByLabelText("date")).toHaveValue("2025-01-15");

    rerender(
      <CommittedDateInputFixture value="2025-02-01" onCommit={onCommit} />,
    );

    expect(screen.getByLabelText("date")).toHaveValue("2025-02-01");
  });

  it("does not commit draft-only changes before confirmation", () => {
    const onCommit = jest.fn();
    render(
      <CommittedDateInputFixture value="2025-01-15" onCommit={onCommit} />,
    );

    fireEvent.change(screen.getByLabelText("date"), {
      target: { value: "2025-01-20" },
    });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits on blur after keyboard edit when value is valid", () => {
    const onCommit = jest.fn();
    render(
      <CommittedDateInputFixture value="2025-01-15" onCommit={onCommit} />,
    );

    const input = screen.getByLabelText("date");
    fireEvent.change(input, { target: { value: "2025-01-20" } });
    fireEvent.keyDown(input, { key: "0" });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith("2025-01-20");
  });

  it("does not commit invalid keyboard input on blur and reverts draft", () => {
    const onCommit = jest.fn();
    render(
      <CommittedDateInputFixture value="2025-01-15" onCommit={onCommit} />,
    );

    const input = screen.getByLabelText("date");
    fireEvent.change(input, { target: { value: "2025-02-30" } });
    fireEvent.keyDown(input, { key: "0" });
    fireEvent.blur(input);

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue("2025-01-15");
  });

  it("commits on Enter when value is valid", () => {
    const onCommit = jest.fn();
    render(
      <CommittedDateInputFixture value="2025-01-15" onCommit={onCommit} />,
    );

    const input = screen.getByLabelText("date");
    fireEvent.change(input, { target: { value: "2025-01-22" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).toHaveBeenCalledWith("2025-01-22");
  });

  it("debounces native picker change commits", () => {
    const onCommit = jest.fn();
    render(
      <CommittedDateInputFixture
        value="2025-01-15"
        onCommit={onCommit}
        debounceMs={350}
      />,
    );

    const input = screen.getByLabelText("date");
    fireEvent.mouseDown(input);
    fireEvent.change(input, { target: { value: "2025-02-10" } });

    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(onCommit).toHaveBeenCalledWith("2025-02-10");
  });
});
