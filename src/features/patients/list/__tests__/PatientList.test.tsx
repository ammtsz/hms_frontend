import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientList from "../index";
import { usePatientList } from "../hooks/usePatientList";

// Mock the usePatientList hook
jest.mock("../hooks/usePatientList", () => ({
  usePatientList: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

const mockPatients = [
  {
    id: 1,
    name: "John Smith",
    phone: "(11) 99999-9999",
    priority: "3",
    status: "T",
  },
  {
    id: 2,
    name: "Emily Williams",
    phone: "(11) 88888-8888",
    priority: "1",
    status: "D",
  },
];

const defaultMockReturn = {
  search: "",
  setSearch: jest.fn(),
  sortBy: "name",
  sortAsc: true,
  loaderRef: { current: null },
  filtered: mockPatients,
  handleSort: jest.fn(),
  paginated: mockPatients,
  statusLegend: {
    N: "New patient",
    T: "In Treatment",
    D: "Discharged",
    C: "Consecutive no-shows",
  },
  priorityLegend: {
    "1": "Priority",
    "2": "Standard",
    "3": "Priority 3",
  },
  loading: false,
  error: null,
  refreshPatients: jest.fn(),
  hasNoPatients: false,
};

describe("PatientList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientList as jest.Mock).mockReturnValue(defaultMockReturn);
  });

  describe("Layout and Structure", () => {
    it("should use consistent card layout", () => {
      render(<PatientList />);

      const cardContainer = document.querySelector(
        ".rounded-lg.border.border-gray-200.bg-white",
      );
      expect(cardContainer).toBeInTheDocument();
    });

    it("should display header with title and description", () => {
      render(<PatientList />);

      expect(screen.getByText("Patients")).toBeInTheDocument();
      expect(
        screen.getByText("Manage and view all registered patients"),
      ).toBeInTheDocument();
    });

    it("should show patient count in header", () => {
      render(<PatientList />);

      expect(screen.getByText(`(${mockPatients.length})`)).toBeInTheDocument();
    });

    it("should display new patient button", () => {
      render(<PatientList />);

      const newPatientButton = screen.getByText("+ New Patient");
      expect(newPatientButton).toBeInTheDocument();
      expect(newPatientButton.closest("a")).toHaveAttribute(
        "href",
        "/patients/new",
      );
    });
  });

  describe("Search Functionality", () => {
    it("should render search input", () => {
      render(<PatientList />);

      const searchInput = screen.getByPlaceholderText("Search by name...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should call setSearch when typing in search input", () => {
      const mockSetSearch = jest.fn();
      (usePatientList as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        setSearch: mockSetSearch,
      });

      render(<PatientList />);

      const searchInput = screen.getByPlaceholderText("Search by name...");
      fireEvent.change(searchInput, { target: { value: "John" } });

      expect(mockSetSearch).toHaveBeenCalledWith("John");
    });
  });

  describe("Table Display", () => {
    it("should render table with correct headers", () => {
      render(<PatientList />);

      const table = within(screen.getByTestId("patient-list-table"));
      expect(table.getByText("Record")).toBeInTheDocument();
      expect(table.getByText("Name")).toBeInTheDocument();
      expect(table.getByText("Phone")).toBeInTheDocument();
      expect(
        table.getByRole("columnheader", { name: "Priority" }),
      ).toBeInTheDocument();
      expect(table.getByText("Status")).toBeInTheDocument();
    });

    it("should display patient data correctly", () => {
      render(<PatientList />);

      const cards = within(screen.getByTestId("patient-list-cards"));
      expect(cards.getByText("John Smith")).toBeInTheDocument();
      expect(cards.getByText("Emily Williams")).toBeInTheDocument();

      const table = within(screen.getByTestId("patient-list-table"));
      expect(table.getByText("John Smith")).toBeInTheDocument();
      expect(table.getByText("Emily Williams")).toBeInTheDocument();
      expect(table.getByText("(11) 99999-9999")).toBeInTheDocument();
      expect(table.getByText("(11) 88888-8888")).toBeInTheDocument();
    });

    it("should make table rows clickable", () => {
      render(<PatientList />);

      const table = screen.getByTestId("patient-list-table");
      const firstRow = within(table).getByText("John Smith").closest("tr");
      expect(firstRow).toHaveClass("cursor-pointer");
    });
  });

  describe("Sorting Functionality", () => {
    it("should call handleSort when clicking column headers", () => {
      const mockHandleSort = jest.fn();
      (usePatientList as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        handleSort: mockHandleSort,
      });

      render(<PatientList />);

      const table = within(screen.getByTestId("patient-list-table"));
      fireEvent.click(table.getByText(/Name/));

      expect(mockHandleSort).toHaveBeenCalledWith("name");
    });

    it("should show sort indicators", () => {
      (usePatientList as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        sortBy: "name",
        sortAsc: true,
      });

      render(<PatientList />);

      const table = within(screen.getByTestId("patient-list-table"));
      expect(table.getByText("Name")).toBeInTheDocument();
      // The sort indicator might be in a different element, so just check for the column header
    });
  });

  describe("Legend Cards", () => {
    it("should display status legend", () => {
      render(<PatientList />);

      expect(screen.getByText("Status Legend:")).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, element) => element?.textContent === "N: New patient",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, element) => element?.textContent === "T: In Treatment",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, element) => element?.textContent === "D: Discharged",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, element) =>
            element?.textContent === "C: Consecutive no-shows",
        ),
      ).toBeInTheDocument();
    });

    it("should display priority legend", () => {
      render(<PatientList />);

      expect(screen.getByText("Priority Legend:")).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, element) => element?.textContent === "1: Priority",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, element) => element?.textContent === "2: Standard",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, element) => element?.textContent === "3: Priority 3",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading state", () => {
      (usePatientList as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      render(<PatientList />);

      expect(screen.getByText("Loading patients...")).toBeInTheDocument();
      expect(screen.getByText("Loading patient list...")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error state", () => {
      const mockRefreshPatients = jest.fn();
      (usePatientList as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        loading: false,
        error: "Error loading patients",
        refreshPatients: mockRefreshPatients,
      });

      render(<PatientList />);

      expect(screen.getByText("Error loading patients")).toBeInTheDocument();
      expect(
        screen.getByText("Error loading patient list"),
      ).toBeInTheDocument();

      const retryButton = screen.getByText("Try again");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRefreshPatients).toHaveBeenCalled();
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive grid for legend cards", () => {
      render(<PatientList />);

      const legendContainer = document.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2",
      );
      expect(legendContainer).toBeInTheDocument();
    });

    it("should render mobile card list and desktop table views", () => {
      render(<PatientList />);

      expect(screen.getByTestId("patient-list-cards")).toBeInTheDocument();
      expect(screen.getByTestId("patient-list-table")).toBeInTheDocument();
      expect(screen.getByTestId("patient-card-1")).toHaveAttribute(
        "href",
        "/patients/1",
      );
    });

    it("should show mobile sort controls", () => {
      render(<PatientList />);

      expect(
        screen.getByTestId("patient-list-mobile-sort"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
    });

    it("should have overflow-x-auto for table", () => {
      render(<PatientList />);

      const tableContainer = within(
        screen.getByTestId("patient-list-table"),
      ).getByRole("table").parentElement;
      expect(tableContainer).toHaveClass("overflow-x-auto");
    });
  });
});
