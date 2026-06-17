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
        error: new Error("Paciente não encontrado"),
        isError: true,
        status: "error",
        refetch: mockRefetch,
      }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(screen.getAllByText("Paciente não encontrado")).toHaveLength(2);
    expect(screen.getByText("Não encontrado")).toBeInTheDocument();
    expect(screen.queryByText("Tentar Novamente")).not.toBeInTheDocument();
    expect(screen.getByText("Voltar para Pacientes")).toBeInTheDocument();
  });

  it("shows generic server error with retry option for other errors", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({
        error: new Error(
          "Erro interno do servidor, por favor tente novamente mais tarde",
        ),
        isError: true,
        status: "error",
        refetch: mockRefetch,
      }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Erro interno do servidor, por favor tente novamente mais tarde",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Erro")).toBeInTheDocument();
    expect(screen.getByText("Tentar Novamente")).toBeInTheDocument();
    expect(screen.getByText("Voltar para Pacientes")).toBeInTheDocument();
  });

  it("handles network errors gracefully", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({
        error: new Error("Erro de rede"),
        isError: true,
        status: "error",
        refetch: mockRefetch,
      }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(screen.getByText("Erro de rede")).toBeInTheDocument();
    expect(screen.getByText("Tentar Novamente")).toBeInTheDocument();
  });

  it("shows patient not found error when patient is null", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Paciente não encontrado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paciente não encontrado.")).toBeInTheDocument();
    expect(screen.getByText("Não encontrado")).toBeInTheDocument();
    expect(screen.getByText("Voltar para Pacientes")).toBeInTheDocument();

    const container = screen
      .getByText("Não encontrado")
      .closest(".flex.flex-col.gap-8.my-6.sm\\:my-16");
    expect(container).toBeInTheDocument();

    const innerContainer = screen
      .getByText("Não encontrado")
      .closest(".max-w-4xl.mx-auto.w-full.px-4");
    expect(innerContainer).toBeInTheDocument();
  });

  it("renders proper breadcrumb items for not found page", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(screen.getByText("Pacientes")).toBeInTheDocument();
    expect(screen.getByText("Não encontrado")).toBeInTheDocument();
  });

  it("handles undefined patient data gracefully", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Paciente não encontrado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paciente não encontrado.")).toBeInTheDocument();
  });

  it("shows PageError component with correct props for not found patient", () => {
    mockUsePatientWithAttendances.mockReturnValue(
      createMockPatientQuery({ refetch: mockRefetch }),
    );

    renderWithQueryClient(<PatientDetailPage />);

    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Paciente não encontrado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paciente não encontrado.")).toBeInTheDocument();
    expect(screen.getByText("Voltar para Pacientes")).toBeInTheDocument();
  });
});
