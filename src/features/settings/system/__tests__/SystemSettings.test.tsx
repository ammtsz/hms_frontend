import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SystemSettings from "../SystemSettings";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { UserRole } from "@/types/auth";

jest.mock("@/contexts/AuthContext");
jest.mock("@/contexts/ToastContext");
jest.mock("@/api/query/hooks/useAppointmentsThresholdQueries", () => ({
  useAppointmentsThreshold: jest.fn(),
  useUpdateAppointmentsThreshold: jest.fn(),
}));
jest.mock("../TreatmentOptionsList", () => {
  return function MockTreatmentOptionsList() {
    return <div data-testid="treatment-options-list">TreatmentOptionsList</div>;
  };
});
jest.mock("../PriorityManagementList", () => {
  return function MockPriorityManagementList() {
    return (
      <div data-testid="priority-management-list">PriorityManagementList</div>
    );
  };
});
jest.mock("../NoteCategoriesManagementList", () => {
  return function MockNoteCategoriesManagementList() {
    return (
      <div data-testid="note-categories-management-list">
        NoteCategoriesManagementList
      </div>
    );
  };
});

const mockUseAuthContext = useAuthContext as jest.MockedFunction<
  typeof useAuthContext
>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const { useAppointmentsThreshold, useUpdateAppointmentsThreshold } =
  jest.requireMock("@/api/query/hooks/useAppointmentsThresholdQueries") as {
    useAppointmentsThreshold: jest.Mock;
    useUpdateAppointmentsThreshold: jest.Mock;
  };

describe("SystemSettings", () => {
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthContext.mockReturnValue({
      user: {
        id: 1,
        name: "Admin",
        email: "admin@test.com",
        displayName: "Admin",
        role: UserRole.ADMIN,
        isActive: true,
        mustChangePassword: false,
        lastLogin: new Date(),
        createdAt: new Date(),
      },
      isAuthenticated: true,
      isLoading: false,
      refreshUser: jest.fn(),
    });
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
      toasts: [],
      removeToast: jest.fn(),
    });
    useAppointmentsThreshold.mockReturnValue({
      data: { missingAppointmentsThreshold: 3 },
      isLoading: false,
    });
    useUpdateAppointmentsThreshold.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it("renders main title and section headers", () => {
    render(<SystemSettings />);

    expect(screen.getByText(/Configurações de Sistema/)).toBeInTheDocument();
    expect(screen.getByText("Limite de faltas")).toBeInTheDocument();
    expect(screen.getByText("Prioridades")).toBeInTheDocument();
    expect(screen.getByText("Categorias das Anotações")).toBeInTheDocument();
    expect(screen.getByText("Locais do Corpo")).toBeInTheDocument();
    expect(screen.getByText("Cores (Fisioterapia)")).toBeInTheDocument();
  });

  it("expands Limite de faltas and shows input when data loaded", () => {
    render(<SystemSettings />);

    fireEvent.click(screen.getByRole("button", { name: /Limite de faltas/i }));

    expect(
      screen.getByRole("spinbutton", { name: /Limite de faltas \(1 a 10\)/i }),
    ).toHaveValue(3);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("shows loading skeleton when threshold is loading", () => {
    useAppointmentsThreshold.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<SystemSettings />);
    fireEvent.click(screen.getByRole("button", { name: /Limite de faltas/i }));

    expect(
      screen.queryByRole("spinbutton", { name: /Limite de faltas/i }),
    ).not.toBeInTheDocument();
  });

  it("disables input and shows admin message when user is not admin", () => {
    mockUseAuthContext.mockReturnValue({
      user: {
        id: 2,
        name: "Staff",
        email: "staff@test.com",
        displayName: "Staff",
        role: UserRole.STAFF,
        isActive: true,
        mustChangePassword: false,
        lastLogin: new Date(),
        createdAt: new Date(),
      },
      isAuthenticated: true,
      isLoading: false,
      refreshUser: jest.fn(),
    });

    render(<SystemSettings />);
    fireEvent.click(screen.getByRole("button", { name: /Limite de faltas/i }));

    const input = screen.getByRole("spinbutton", {
      name: /Limite de faltas \(1 a 10\)/i,
    });
    expect(input).toBeDisabled();
    expect(
      screen.getByText("Apenas administradores podem alterar este valor."),
    ).toBeInTheDocument();
  });

  it("shows validation error when value is out of range", () => {
    render(<SystemSettings />);
    fireEvent.click(screen.getByRole("button", { name: /Limite de faltas/i }));

    const input = screen.getByRole("spinbutton", {
      name: /Limite de faltas \(1 a 10\)/i,
    });
    fireEvent.change(input, { target: { value: "15" } });

    expect(
      screen.getByText(/Informe um valor entre 1 e 10/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("calls update mutation and shows success toast on save", () => {
    const mockMutate = jest.fn();
    useUpdateAppointmentsThreshold.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<SystemSettings />);
    fireEvent.click(screen.getByRole("button", { name: /Limite de faltas/i }));

    const input = screen.getByRole("spinbutton", {
      name: /Limite de faltas \(1 a 10\)/i,
    });
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(mockMutate).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );

    const call = mockMutate.mock.calls[0];
    const onSuccess = call[1].onSuccess;
    onSuccess();
    expect(mockShowToast).toHaveBeenCalledWith(
      "Configuração atualizada com sucesso.",
      "success",
    );
  });

  it("shows error toast when mutation fails", () => {
    const mockMutate = jest.fn();
    useUpdateAppointmentsThreshold.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<SystemSettings />);
    fireEvent.click(screen.getByRole("button", { name: /Limite de faltas/i }));

    const input = screen.getByRole("spinbutton", {
      name: /Limite de faltas \(1 a 10\)/i,
    });
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    const call = mockMutate.mock.calls[0];
    const onError = call[1].onError;
    onError(new Error("Network error"));
    expect(mockShowToast).toHaveBeenCalledWith("Network error", "error");
  });

  it("renders TreatmentOptionsList when body locations and colors sections are expanded", () => {
    render(<SystemSettings />);

    fireEvent.click(screen.getByRole("button", { name: /Locais do Corpo/i }));
    expect(screen.getAllByTestId("treatment-options-list")).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", { name: /Cores \(Fisioterapia\)/i }),
    );
    expect(screen.getAllByTestId("treatment-options-list")).toHaveLength(2);
  });

  it("renders PriorityManagementList and NoteCategoriesManagementList when expanded", () => {
    render(<SystemSettings />);

    fireEvent.click(screen.getByRole("button", { name: /^Prioridades$/i }));
    expect(screen.getByTestId("priority-management-list")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Categorias das Anotações/i }),
    );
    expect(
      screen.getByTestId("note-categories-management-list"),
    ).toBeInTheDocument();
  });
});
