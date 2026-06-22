import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateFormModal } from "../components/TemplateFormModal";
import "@testing-library/jest-dom";

describe("TemplateFormModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(
      <TemplateFormModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.queryByText("New Template")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText("New Template")).toBeInTheDocument();
  });

  it("should show edit mode title when template is provided", () => {
    const mockTemplate = {
      id: 1,
      name: "National Holidays",
      description: "Brazilian National Holidays",
      holidays: [],
      createdDate: "2024-01-01",
    };

    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        template={mockTemplate}
      />,
    );

    expect(screen.getByText("Edit Template")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    const closeButton = screen.getAllByRole("button")[0];
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should add a holiday when "Add Holiday" is clicked', () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    const addButton = screen.getByText("Add Holiday");
    fireEvent.click(addButton);

    expect(screen.getByText("Month")).toBeInTheDocument();
    expect(screen.getByText("Day")).toBeInTheDocument();
  });

  it("should submit form with correct data", () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    // Fill in template name
    const nameInput = screen.getByPlaceholderText(
      "e.g. National Brazilian Holidays",
    );
    fireEvent.change(nameInput, { target: { value: "Test Template" } });

    // Add a holiday
    const addButton = screen.getByText("Add Holiday");
    fireEvent.click(addButton);

    // Fill in holiday name
    const holidayNameInput = screen.getByPlaceholderText("e.g. Christmas");
    fireEvent.change(holidayNameInput, { target: { value: "Christmas" } });

    // Submit form
    const submitButton = screen.getByText("Create Template");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: "Test Template",
      description: undefined,
      holidays: expect.arrayContaining([
        expect.objectContaining({
          month: 1,
          day: 1,
          name: "Christmas",
        }),
      ]),
    });
  });
});
