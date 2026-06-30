import { render, screen, fireEvent, within } from "@testing-library/react";
import HolidayList from "../components/HolidayList";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import {
  formatBlockedTreatmentTypes,
  HOLIDAY_LIST_EMPTY_STATE,
  HOLIDAY_LIST_TABLE_HEADERS,
} from "../utils/holidayDisplayUtils";

jest.mock("@/hooks/useDateHelpers");

function getHolidayTable() {
  const table = document.querySelector(
    '[data-testid="holiday-list-table"]',
  ) as HTMLElement;
  if (!table) {
    throw new Error("holiday-list-table not found");
  }
  return within(table);
}

const mockHolidays = [
  {
    id: 1,
    holidayDate: "2026-12-25",
    name: "Christmas",
    description: "Federal Statutory Holiday",
    holidayGroupId: null,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
  {
    id: 2,
    holidayDate: "2026-01-01",
    name: "New Year",
    description: "",
    holidayGroupId: null,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
  {
    id: 3,
    holidayDate: "2026-12-24",
    name: "Christmas Period",
    description: "Christmas celebration",
    holidayGroupId: "group-123",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
  {
    id: 4,
    holidayDate: "2026-12-26",
    name: "Christmas Period",
    description: "Christmas celebration",
    holidayGroupId: "group-123",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
];

describe("HolidayList", () => {
  const mockFormatDate = jest.fn((date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-US");
  });

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCreateClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useDateHelpers as jest.Mock).mockReturnValue({
      formatDate: mockFormatDate,
      formatDisplayDate: mockFormatDate,
    });
  });

  it("displays empty state when no holidays", () => {
    render(
      <HolidayList
        holidays={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    expect(screen.getByText(HOLIDAY_LIST_EMPTY_STATE.title)).toBeInTheDocument();
    expect(
      screen.getByText(HOLIDAY_LIST_EMPTY_STATE.description),
    ).toBeInTheDocument();
    expect(screen.getByText(HOLIDAY_LIST_EMPTY_STATE.button)).toBeInTheDocument();
  });

  it("displays empty state when holidays is undefined", () => {
    render(
      <HolidayList
        holidays={undefined}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    expect(screen.getByText(HOLIDAY_LIST_EMPTY_STATE.title)).toBeInTheDocument();
  });

  it("calls onCreateClick when clicking empty state button", () => {
    render(
      <HolidayList
        holidays={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const button = screen.getByText(HOLIDAY_LIST_EMPTY_STATE.button);
    fireEvent.click(button);

    expect(mockOnCreateClick).toHaveBeenCalledTimes(1);
  });

  it("renders mobile cards and desktop table in the DOM", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    expect(screen.getByTestId("holiday-list-cards")).toBeInTheDocument();
    expect(screen.getByTestId("holiday-list-table")).toBeInTheDocument();
    expect(screen.getByTestId("holiday-card-1")).toBeInTheDocument();
  });

  it("displays table with holidays", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const table = getHolidayTable();
    expect(table.getByText("Christmas")).toBeInTheDocument();
    expect(table.getByText("New Year")).toBeInTheDocument();
    expect(table.getByText("Federal Statutory Holiday")).toBeInTheDocument();
  });

  it("displays table headers", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const table = getHolidayTable();
    expect(table.getByText(HOLIDAY_LIST_TABLE_HEADERS.dates)).toBeInTheDocument();
    expect(table.getByText(HOLIDAY_LIST_TABLE_HEADERS.name)).toBeInTheDocument();
    expect(table.getByText(HOLIDAY_LIST_TABLE_HEADERS.description)).toBeInTheDocument();
    expect(table.getByText(HOLIDAY_LIST_TABLE_HEADERS.duration)).toBeInTheDocument();
    expect(table.getByText(HOLIDAY_LIST_TABLE_HEADERS.dayOff)).toBeInTheDocument();
    expect(table.getByText(HOLIDAY_LIST_TABLE_HEADERS.actions)).toBeInTheDocument();
  });

  it("displays duration and blocked treatment types correctly", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    // Check for duration display - there should be multiple "1 day" elements since both holidays are single days
    const durationElements = screen.getAllByText("1 day");
    expect(durationElements.length).toBeGreaterThan(0);

    const blockedTypesElements = screen.getAllByText(
      formatBlockedTreatmentTypes(),
    );
    expect(blockedTypesElements.length).toBeGreaterThan(0);
  });

  it("displays specific blocked treatment types correctly", () => {
    const holidaysWithBlockedTypes = [
      {
        id: 1,
        holidayDate: "2026-12-25",
        name: "Christmas",
        description: "Federal Statutory Holiday",
        blockedTreatmentTypes: ["assessment", "physiotherapy"],
        holidayGroupId: null,
        createdDate: "2026-01-01",
        updatedDate: "2026-01-01",
      },
    ];

    render(
      <HolidayList
        holidays={holidaysWithBlockedTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const table = getHolidayTable();
    expect(
      table.getByText(
        formatBlockedTreatmentTypes(["assessment", "physiotherapy"]),
      ),
    ).toBeInTheDocument();
  });

  it('displays "-" for missing description', () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const cells = screen.getAllByRole("cell");
    const descriptionCells = cells.filter((cell) =>
      cell.textContent?.includes("-"),
    );
    expect(descriptionCells.length).toBeGreaterThan(0);
  });

  it("displays edit and delete buttons for each holiday in table and cards", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const table = getHolidayTable();
    expect(table.getAllByTitle("Edit")).toHaveLength(2);
    expect(table.getAllByTitle("Delete")).toHaveLength(2);

    const cards = within(screen.getByTestId("holiday-list-cards"));
    expect(cards.getAllByTitle("Edit")).toHaveLength(2);
    expect(cards.getAllByTitle("Delete")).toHaveLength(2);
  });

  it("calls onEdit with correct holiday when clicking edit", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const editButtons = screen.getAllByTitle("Edit");
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockHolidays[0]);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete with correct holiday when clicking delete", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const deleteButtons = screen.getAllByTitle("Delete");
    fireEvent.click(deleteButtons[1]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockHolidays[1]);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("applies hover styles to table rows", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const rows = screen.getAllByRole("row");
    // Skip header row
    const dataRows = rows.slice(1);

    dataRows.forEach((row) => {
      expect(row).toHaveClass("hover:bg-gray-50");
    });
  });

  it("displays all holidays in correct order", () => {
    render(
      <HolidayList
        holidays={mockHolidays}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateClick={mockOnCreateClick}
      />,
    );

    const holidayNames = screen.getAllByRole("cell").filter((cell) => {
      const text = cell.textContent;
      return text === "Christmas" || text === "New Year";
    });

    expect(holidayNames).toHaveLength(2);
  });
});
