import React from "react";
import { render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import PatientDetailPage from "../page";
import { usePatientWithAttendances } from "@/api/query/hooks/usePatientQueries";
import type { Patient } from "@/types/types";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  usePatientWithAttendances: jest.fn(),
}));

jest.mock("@/components/common/Breadcrumb", () => {
  return function MockBreadcrumb({
    items,
  }: {
    items: Array<{ label: string; href?: string; isActive?: boolean }>;
  }) {
    return (
      <nav>
        {items.map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </nav>
    );
  };
});

const mockUsePatientWithAttendances =
  usePatientWithAttendances as jest.MockedFunction<
    typeof usePatientWithAttendances
  >;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

const createMockPatientQuery = (
  overrides: Partial<UseQueryResult<Patient, Error>> = {},
): UseQueryResult<Patient, Error> =>
  ({
    data: undefined,
    isLoading: false,
    isRefetching: false,
    error: null,
    refetch: jest.fn(),
    failureCount: 0,
    isError: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: false,
    isStale: false,
    isFetching: false,
    isFetchedAfterMount: true,
    isFetched: true,
    isPlaceholderData: false,
    failureReason: null,
    errorUpdateCount: 0,
    status: "success",
    fetchStatus: "idle",
    remove: jest.fn(),
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    isPaused: false,
    isEnabled: true,
    isInitialLoading: false,
    ...overrides,
  }) as unknown as UseQueryResult<Patient, Error>;

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe("PatientDetailPage Error Handling", () => {
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: "non-existent-id" });
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );
  });

  it("shows patient not found error when patient does not exist", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({
        error: new Error("Patient not found"),
        isError: true,
        status: "error",
        refetch: mockRefetch,
      }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getAllByText("Patient not found")).toHaveLength(2);
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    expect(screen.getByText("Back to Patients")).toBeInTheDocument();
  });

  it("shows generic server error with retry option for other errors", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({
        error: new Error("Internal server error, please try again later"),
        isError: true,
        status: "error",
        refetch: mockRefetch,
      }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(
      screen.getByText("Internal server error, please try again later"),
    ).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Back to Patients")).toBeInTheDocument();
  });

  it("handles network errors gracefully", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({
        error: new Error("Network error"),
        isError: true,
        status: "error",
        refetch: mockRefetch,
      }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("shows patient not found error when patient is null", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Patient not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Patient not found.")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.getByText("Back to Patients")).toBeInTheDocument();

    const container = screen
      .getByText("Not found")
      .closest(".flex.flex-col.gap-8.my-6.sm\\:my-16");
    expect(container).toBeInTheDocument();

    const innerContainer = screen
      .getByText("Not found")
      .closest(".max-w-4xl.mx-auto.w-full.px-4");
    expect(innerContainer).toBeInTheDocument();
  });

  it("renders proper breadcrumb items for not found page", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByText("Patients")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  it("handles undefined patient data gracefully", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Patient not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Patient not found.")).toBeInTheDocument();
  });

  it("shows PageError component with correct props for not found patient", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Patient not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Patient not found.")).toBeInTheDocument();
    expect(screen.getByText("Back to Patients")).toBeInTheDocument();
  });
});
