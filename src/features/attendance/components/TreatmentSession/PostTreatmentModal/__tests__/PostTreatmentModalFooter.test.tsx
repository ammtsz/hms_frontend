import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PostTreatmentModalFooter } from "../PostTreatmentModalFooter";

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
    expect(screen.getByText(/pronto para registrar/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /registrar sessão/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancelar/i }),
    ).toBeInTheDocument();
  });

  it("renders mark at least one treatment message when canSubmit is false", () => {
    render(<PostTreatmentModalFooter {...defaultProps} canSubmit={false} />);
    expect(
      screen.getByText(/marque ao menos um tratamento/i),
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
      screen.getByText(/justifique todos os tratamentos não realizados/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/pronto para registrar/i),
    ).not.toBeInTheDocument();
  });

  it("shows submit error when present", () => {
    render(
      <PostTreatmentModalFooter
        {...defaultProps}
        submitError="Erro ao enviar"
      />,
    );
    expect(screen.getByText("Erro ao enviar")).toBeInTheDocument();
  });

  it("calls onClose when Cancelar is clicked", () => {
    const onClose = jest.fn();
    render(<PostTreatmentModalFooter {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when Registrar Sessão is clicked", () => {
    const onSubmit = jest.fn();
    render(<PostTreatmentModalFooter {...defaultProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /registrar sessão/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables submit button when isSubmitDisabled is true", () => {
    render(
      <PostTreatmentModalFooter {...defaultProps} isSubmitDisabled={true} />,
    );
    expect(
      screen.getByRole("button", { name: /registrar sessão/i }),
    ).toBeDisabled();
  });

  it("disables cancel button when isSubmitting is true", () => {
    render(<PostTreatmentModalFooter {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
  });

  it("shows Registrando... on submit button when isSubmitting is true", () => {
    render(<PostTreatmentModalFooter {...defaultProps} isSubmitting={true} />);
    expect(
      screen.getByRole("button", { name: /registrando/i }),
    ).toBeInTheDocument();
  });
});
