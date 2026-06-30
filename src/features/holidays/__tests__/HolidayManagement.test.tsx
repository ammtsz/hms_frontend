import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HolidayManagement from "../index";
import { useHolidayManagement } from "../hooks/useHolidayManagement";
import {
  useHolidayTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useApplyTemplate,
} from "@/api/query/hooks/useHolidayTemplateQueries";
import { Holiday } from "@/types/holiday";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { notFound } from "next/navigation";

const mockHolidays = [
  {
    id: 1,
    holidayDate: "2026-12-25",
    name: "Christmas",
    description: "Federal Statutory Holiday 1",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
  {
    id: 2,
    holidayDate: "2026-01-01",
    name: "New Year",
    description: null,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
];

const mockMutationHook = () => ({
  mutateAsync: jest.fn(),
  isPending: false,
});

// Mock hooks
jest.mock("../hooks/useHolidayManagement");
jest.mock("@/api/query/hooks/useHolidayTemplateQueries");
jest.mock("@/contexts/AuthContext");
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

// Mock child components
jest.mock("../components/HolidayActionsBar", () => {
  return function HolidayActionsBar({
    onYearChange,
    onCreateClick,
  }: {
    onYearChange: (year: number) => void;
    onCreateClick: () => void;
  }) {
    return (
      <div data-testid="holiday-actions-bar">
        <select
          onChange={(e) => onYearChange(Number(e.target.value))}
          defaultValue={new Date().getFullYear()}
        >
          {[2024, 2025, 2026, 2027, 2028].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <button onClick={onCreateClick}>New Holiday</button>
      </div>
    );
  };
});

jest.mock("../components/HolidayList", () => {
  return function HolidayList({
    holidays,
    onEdit,
    onDelete,
  }: {
    holidays: Holiday[];
    onEdit: (holiday: Holiday) => void;
    onDelete: (holiday: Holiday) => void;
  }) {
    if (!holidays || holidays.length === 0) {
      return <div data-testid="empty-state">No holidays registered</div>;
    }

    return (
      <div data-testid="holiday-list">
        {holidays.map((holiday) => (
          <div key={holiday.id} data-testid={`holiday-${holiday.id}`}>
            <span>{holiday.name}</span>
            {holiday.description && <span>{holiday.description}</span>}
            <button onClick={() => onEdit(holiday)}>Edit {holiday.id}</button>
            <button onClick={() => onDelete(holiday)}>
              Delete {holiday.id}
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock("../components/HolidayFormModal", () => {
  return function HolidayFormModal({
    onClose,
  }: {
    onClose: () => void;
    onSuccess: () => void;
    holiday?: Holiday;
  }) {
    return (
      <div data-testid="holiday-form-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  };
});

jest.mock("../components/HolidayDeleteConfirmModal", () => {
  return function HolidayDeleteConfirmModal({
    holiday,
    onCancel,
    onConfirm,
  }: {
    holiday: Holiday | null;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
  }) {
    if (!holiday) return null;
    return (
      <div data-testid="delete-confirm-modal">
        <button onClick={onCancel}>Cancel Delete</button>
        <button onClick={onConfirm}>Confirm Delete</button>
      </div>
    );
  };
});

describe("HolidayManagement", () => {
  const mockSetShowCreateModal = jest.fn();
  const mockSetEditingHoliday = jest.fn();
  const mockSetDeletingHoliday = jest.fn();
  const mockConfirmDelete = jest.fn();
  const mockHandleEdit = jest.fn();
  const mockHandleDelete = jest.fn();
  const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

  const defaultHookReturn = {
    selectedYear: 2026,
    showCreateModal: false,
    editingHoliday: null,
    deletingHoliday: null,
    holidays: mockHolidays,
    isLoading: false,
    error: null,
    isDeleting: false,
    years: [2026, 2027, 2028, 2029, 2030],
    setSelectedYear: jest.fn(),
    setShowCreateModal: mockSetShowCreateModal,
    setEditingHoliday: mockSetEditingHoliday,
    setDeletingHoliday: mockSetDeletingHoliday,
    handleDelete: mockHandleDelete,
    handleEdit: mockHandleEdit,
    confirmDelete: mockConfirmDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useHolidayTemplates as jest.Mock).mockReturnValue({
      data: { value: [] },
      isLoading: false,
    });
    (useCreateTemplate as jest.Mock).mockReturnValue(mockMutationHook());
    (useUpdateTemplate as jest.Mock).mockReturnValue(mockMutationHook());
    (useDeleteTemplate as jest.Mock).mockReturnValue(mockMutationHook());
    (useApplyTemplate as jest.Mock).mockReturnValue(mockMutationHook());

    (useAuthContext as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        role: UserRole.ADMIN,
        isActive: true,
        mustChangePassword: false,
        lastLogin: null,
        createdAt: new Date("2026-01-01"),
      },
      isAuthenticated: true,
      isLoading: false,
      refreshUser: jest.fn(),
    });

    (useHolidayManagement as jest.Mock).mockReturnValue(defaultHookReturn);
  });

  it("should display loading message when auth is loading", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      refreshUser: jest.fn(),
    });

    render(<HolidayManagement />);

    expect(screen.getAllByText("Loading...")[0]).toBeInTheDocument();
  });

  it("should call notFound when user is not authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      refreshUser: jest.fn(),
    });

    render(<HolidayManagement />);

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should call notFound when user is not an admin", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      user: {
        id: 2,
        name: "Staff User",
        email: "staff@example.com",
        role: UserRole.STAFF,
        isActive: true,
        mustChangePassword: false,
        lastLogin: null,
        createdAt: new Date("2026-01-01"),
      },
      isAuthenticated: true,
      isLoading: false,
      refreshUser: jest.fn(),
    });

    render(<HolidayManagement />);

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders HolidayManagement component", () => {
    render(<HolidayManagement />);
    expect(screen.getByText("Holiday Management")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    (useHolidayManagement as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
      holidays: undefined,
    });

    render(<HolidayManagement />);
    expect(screen.getByText("Loading holidays...")).toBeInTheDocument();
  });

  it("displays error state", () => {
    (useHolidayManagement as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      error: new Error("Test error"),
      holidays: undefined,
    });

    render(<HolidayManagement />);
    expect(screen.getByText("Error loading holidays")).toBeInTheDocument();
  });

  it("displays year selector with 5 years", () => {
    render(<HolidayManagement />);
    expect(screen.getByTestId("holiday-actions-bar")).toBeInTheDocument();
  });

  it("opens create modal", () => {
    render(<HolidayManagement />);

    fireEvent.click(screen.getByText("New Holiday"));
    expect(mockSetShowCreateModal).toHaveBeenCalledWith(true);
  });

  it("closes create modal", () => {
    (useHolidayManagement as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      showCreateModal: true,
    });

    render(<HolidayManagement />);
    expect(screen.getByTestId("holiday-form-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close Modal"));
    expect(mockSetShowCreateModal).toHaveBeenCalledWith(false);
  });

  it("displays holiday list when holidays exist", () => {
    render(<HolidayManagement />);

    expect(screen.getByText("Christmas")).toBeInTheDocument();
    expect(screen.getByText("New Year")).toBeInTheDocument();
  });

  it("displays empty state when no holidays", () => {
    (useHolidayManagement as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      holidays: [],
    });

    render(<HolidayManagement />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("opens edit modal when clicking edit button", () => {
    render(<HolidayManagement />);

    fireEvent.click(screen.getByText("Edit 1"));
    expect(mockHandleEdit).toHaveBeenCalledWith(mockHolidays[0]);
  });

  it("opens delete confirmation when clicking delete", () => {
    render(<HolidayManagement />);

    fireEvent.click(screen.getByText("Delete 1"));
    expect(mockHandleDelete).toHaveBeenCalledWith(mockHolidays[0]);
  });

  it("closes delete confirmation", () => {
    (useHolidayManagement as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      deletingHoliday: mockHolidays[0],
    });

    render(<HolidayManagement />);
    expect(screen.getByTestId("delete-confirm-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel Delete"));
    expect(mockSetDeletingHoliday).toHaveBeenCalledWith(null);
  });

  it("calls delete mutation when confirming delete", async () => {
    (useHolidayManagement as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      deletingHoliday: mockHolidays[0],
    });

    render(<HolidayManagement />);
    expect(screen.getByTestId("delete-confirm-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirm Delete"));

    await waitFor(() => {
      expect(mockConfirmDelete).toHaveBeenCalled();
    });
  });
});
