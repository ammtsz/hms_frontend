import { render, screen, fireEvent } from "@testing-library/react";
import UpcomingHolidaysWidget from "../components/UpcomingHolidaysWidget";
import { UPCOMING_HOLIDAYS_LABELS } from "../utils/agendaFilterConstants";
import { useUpcomingHolidays } from "@/api/query/hooks/useHolidayQueries";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

jest.mock("@/api/query/hooks/useHolidayQueries");
jest.mock("@/hooks/useDateHelpers");
jest.mock("@/contexts/AuthContext");

const mockHolidays = [
  {
    id: 1,
    holidayDate: "2026-12-25",
    name: "Christmas",
    description: "National Holiday",
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

describe("UpcomingHolidaysWidget", () => {
  const mockFormatDisplayDate = jest.fn((date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-US");
  });

  function expandWidget() {
    fireEvent.click(screen.getByRole("button", { name: /Upcoming Holidays/i }));
  }

  beforeEach(() => {
    jest.clearAllMocks();

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

    (useDateHelpers as jest.Mock).mockReturnValue({
      formatDisplayDate: mockFormatDisplayDate,
    });
  });

  it("always renders shell with title when holidays list is empty", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);

    expect(screen.getByText(UPCOMING_HOLIDAYS_LABELS.title)).toBeInTheDocument();
    expect(
      screen.queryByText(UPCOMING_HOLIDAYS_LABELS.empty),
    ).not.toBeInTheDocument();
  });

  it("shows empty message when expanded and holidays is undefined", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    expect(screen.getByText(UPCOMING_HOLIDAYS_LABELS.empty)).toBeInTheDocument();
  });

  it("shows empty message when expanded and loading", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    expect(screen.getByText(UPCOMING_HOLIDAYS_LABELS.empty)).toBeInTheDocument();
  });

  it("shows empty message when expanded and error", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    expect(screen.getByText(UPCOMING_HOLIDAYS_LABELS.empty)).toBeInTheDocument();
  });

  it("shows empty message when expanded and data is empty array", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    expect(screen.getByText(UPCOMING_HOLIDAYS_LABELS.empty)).toBeInTheDocument();
  });

  it("does not list holiday names until expanded", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);

    expect(screen.queryByText("Christmas")).not.toBeInTheDocument();
    expandWidget();
    expect(screen.getByText("Christmas")).toBeInTheDocument();
    expect(screen.getByText("New Year")).toBeInTheDocument();
  });

  it("formats holiday dates using formatDisplayDate when expanded", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    expect(mockFormatDisplayDate).toHaveBeenCalledWith("2026-12-25");
    expect(mockFormatDisplayDate).toHaveBeenCalledWith("2026-01-01");
  });

  it("displays holiday descriptions when expanded and available", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    expect(screen.getByText(/National Holiday/)).toBeInTheDocument();
  });

  it("does not render description span for holidays with null description", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    const descriptions = screen.queryAllByText(/National Holiday/);
    expect(descriptions).toHaveLength(1);
  });

  it("displays link to holiday management for admin users", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);

    const link = screen.getByText(UPCOMING_HOLIDAYS_LABELS.manageLink);
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/agenda/holidays");
  });

  it("does not display manage link for staff users", () => {
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

    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);

    expect(screen.queryByText(UPCOMING_HOLIDAYS_LABELS.manageLink)).not.toBeInTheDocument();
  });

  it("toggles chevron when expand button is clicked", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    const { container } = render(<UpcomingHolidaysWidget />);

    expect(container.querySelector(".lucide-chevron-down")).toBeInTheDocument();
    expandWidget();
    expect(container.querySelector(".lucide-chevron-up")).toBeInTheDocument();
  });

  it("requests upcoming holidays with limit 3", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);

    expect(useUpcomingHolidays).toHaveBeenCalledWith(3);
  });

  it("applies correct styling classes on root", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    const { container } = render(<UpcomingHolidaysWidget />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass(
      "rounded-lg",
      "border",
      "border-gray-200",
      "bg-gray-50",
      "shadow-sm",
    );
    expect(mainDiv).not.toHaveClass("card-shadow");
  });

  it("preserves holiday order from hook when expanded", () => {
    (useUpcomingHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      isError: false,
    });

    render(<UpcomingHolidaysWidget />);
    expandWidget();

    const names = screen.getAllByText(/Christmas|New Year/);
    expect(names.map((n) => n.textContent)).toEqual(["Christmas", "New Year"]);
  });
});
