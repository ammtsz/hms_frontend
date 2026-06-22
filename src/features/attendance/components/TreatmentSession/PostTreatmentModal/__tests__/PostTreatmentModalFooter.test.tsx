import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PostTreatmentModalFooter } from "../PostTreatmentModalFooter";
import { POST_TREATMENT_FOOTER_MESSAGES } from "../postTreatmentFooter.utils";

const defaultProps = {
  submitError: null,
  canSubmit: true,
  uncheckedWithMissingReason: false,
  isSubmitDisabled: false,
  isSubmitting: false,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
};

describe("PostTreatmentModalFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ready to submit message when canSubmit is true", () => {
    render(<PostTreatmentModalFooter {...defaultProps} />);
    expect(
      screen.getByText(POST_TREATMENT_FOOTER_MESSAGES.ready),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register Session/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancel/i }),
    ).toBeInTheDocument();
  });

  it("renders mark at least one treatment message when canSubmit is false", () => {
    render(<PostTreatmentModalFooter {...defaultProps} canSubmit={false} />);
    expect(
      screen.getByText(POST_TREATMENT_FOOTER_MESSAGES.selectTreatment),
    ).toBeInTheDocument();
  });

  it("renders cancellation reason message when unchecked row lacks reason", () => {
    render(
      <PostTreatmentModalFooter
        {...defaultProps}
        uncheckedWithMissingReason={true}
        isSubmitDisabled={true}
      />,
    );
    expect(
      screen.getByText(POST_TREATMENT_FOOTER_MESSAGES.justifyUnperformed),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(POST_TREATMENT_FOOTER_MESSAGES.ready),
    ).not.toBeInTheDocument();
  });

  it("shows submit error when present", () => {
    render(
      <PostTreatmentModalFooter
        {...defaultProps}
        submitError="Error submitting"
      />,
    );
    expect(screen.getByText("Error submitting")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = jest.fn();
    render(<PostTreatmentModalFooter {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when Register Session is clicked", () => {
    const onSubmit = jest.fn();
    render(<PostTreatmentModalFooter {...defaultProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /Register Session/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables submit button when isSubmitDisabled is true", () => {
    render(
      <PostTreatmentModalFooter {...defaultProps} isSubmitDisabled={true} />,
    );
    expect(
      screen.getByRole("button", { name: /Register Session/i }),
    ).toBeDisabled();
  });

  it("disables cancel button when isSubmitting is true", () => {
    render(<PostTreatmentModalFooter {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
  });

  it("shows Registering... on submit button when isSubmitting is true", () => {
    render(<PostTreatmentModalFooter {...defaultProps} isSubmitting={true} />);
    expect(
      screen.getByRole("button", { name: /registering/i }),
    ).toBeInTheDocument();
  });
});
