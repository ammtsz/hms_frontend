import { render, screen, fireEvent } from "@testing-library/react";
import HolidayDeleteConfirmModal from "../components/HolidayDeleteConfirmModal";
import { useDateHelpers } from "@/hooks/useDateHelpers";

jest.mock("@/hooks/useDateHelpers");

const mockHoliday = {
  id: 1,
  holidayDate: "2026-12-25",
  name: "Christmas",
  description: "Federal Statutory Holiday",
  createdDate: "2026-01-01",
  updatedDate: "2026-01-01",
};

describe("HolidayDeleteConfirmModal", () => {
  const mockFormatDate = jest.fn((date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-US");
  });

  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useDateHelpers as jest.Mock).mockReturnValue({
      formatDate: mockFormatDate,
    });
  });

  it("does not render when holiday is null", () => {
    const { container } = render(
      <HolidayDeleteConfirmModal
        holiday={null}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders modal when holiday is provided", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete the holiday/i),
    ).toBeInTheDocument();
  });

  it("displays holiday name in confirmation message", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(screen.getByText(/Christmas/i)).toBeInTheDocument();
  });

  it("displays formatted holiday date", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(mockFormatDate).toHaveBeenCalledWith("2026-12-25");
  });

  it("calls onCancel when clicking cancel button", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when clicking confirm button", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    const confirmButton = screen.getByText("Delete");
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("disables buttons when isDeleting is true", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    const confirmButton = screen.getByText("Deleting...");

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it('shows "Deleting..." text when isDeleting is true', () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />,
    );

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it('shows "Delete" text when isDeleting is false', () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Deleting...")).not.toBeInTheDocument();
  });

  it("applies red styling to confirm button", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    const confirmButton = screen.getByText("Delete");
    expect(confirmButton).toHaveClass("bg-red-600");
  });

  it("does not call onConfirm when button is disabled", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />,
    );

    const confirmButton = screen.getByText("Deleting...");
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("renders title in BaseModal header", () => {
    render(
      <HolidayDeleteConfirmModal
        holiday={mockHoliday}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Confirm Deletion" }),
    ).toBeInTheDocument();
  });
});
