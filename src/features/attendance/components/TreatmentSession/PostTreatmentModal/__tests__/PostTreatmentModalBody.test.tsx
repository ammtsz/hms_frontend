import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PostTreatmentModalBody } from "../PostTreatmentModalBody";
import type { PostTreatmentRow } from "../types";

jest.mock("../TreatmentTypeSection", () => ({
  TreatmentTypeSection: ({
    treatmentType,
    rows,
  }: {
    treatmentType: string;
    rows: PostTreatmentRow[];
  }) => (
    <div data-testid={`section-${treatmentType}`}>
      {treatmentType}: {rows.length} row(s)
    </div>
  ),
}));
jest.mock("../GeneralNotesField", () => ({
  GeneralNotesField: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div data-testid="general-notes">
      <label>Notes (optional)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Notes"
      />
    </div>
  ),
}));

const defaultProps = {
  loading: false,
  error: null,
  rows: [] as PostTreatmentRow[],
  rowsByType: {
    physiotherapy: [] as PostTreatmentRow[],
    tens: [] as PostTreatmentRow[],
  },
  completedAttendanceIds: new Set<number>(),
  cancellationReasons: new Map<number, string>(),
  generalNotes: "",
  setGeneralNotes: jest.fn(),
  isSubmitting: false,
  onToggle: jest.fn(),
  onCancellationReasonChange: jest.fn(),
  onRetry: jest.fn(),
};

describe("PostTreatmentModalBody", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    render(<PostTreatmentModalBody {...defaultProps} loading={true} />);
    expect(screen.getAllByText("Loading...")[0]).toBeInTheDocument();
  });

  it("shows error state with message and retry button", () => {
    const onRetry = jest.fn();
    render(
      <PostTreatmentModalBody
        {...defaultProps}
        error={new Error("Failed to load")}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    const retryButton = screen.getByRole("button", {
      name: /try again/i,
    });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows error state for non-Error object", () => {
    render(
      <PostTreatmentModalBody {...defaultProps} error="Something went wrong" />,
    );
    expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("shows empty state when no rows", () => {
    const onRetry = jest.fn();
    render(<PostTreatmentModalBody {...defaultProps} onRetry={onRetry} />);
    expect(
      screen.getByText(/no treatments found for these attendances/i),
    ).toBeInTheDocument();
    const retryButton = screen.getByRole("button", {
      name: /try again/i,
    });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders treatment sections and general notes when rows exist", () => {
    const rowsByType = {
      physiotherapy: [{ attendanceId: 1 }] as unknown as PostTreatmentRow[],
      tens: [] as PostTreatmentRow[],
    };
    const rows = rowsByType.physiotherapy;
    render(
      <PostTreatmentModalBody
        {...defaultProps}
        rows={rows}
        rowsByType={rowsByType}
      />,
    );
    expect(
      screen.getByText(/Treatments completed.*uncheck them and provide a reason/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("section-physiotherapy")).toBeInTheDocument();
    expect(screen.getByTestId("general-notes")).toBeInTheDocument();
  });

  it("calls setGeneralNotes when general notes change", () => {
    const setGeneralNotes = jest.fn();
    const rowsByType = {
      physiotherapy: [{ attendanceId: 1 }] as unknown as PostTreatmentRow[],
      tens: [] as PostTreatmentRow[],
    };
    const rows = rowsByType.physiotherapy;
    render(
      <PostTreatmentModalBody
        {...defaultProps}
        rows={rows}
        rowsByType={rowsByType}
        generalNotes=""
        setGeneralNotes={setGeneralNotes}
      />,
    );
    const textarea = screen.getByRole("textbox", { name: /notes/i });
    fireEvent.change(textarea, { target: { value: "New note" } });
    expect(setGeneralNotes).toHaveBeenCalledWith("New note");
  });
});
