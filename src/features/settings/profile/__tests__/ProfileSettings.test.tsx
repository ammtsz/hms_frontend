import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProfileSettings from "../ProfileSettings";
import { useAuth } from "@/contexts/AuthContext";
import { notFound } from "next/navigation";
import { UserRole } from "@/types/auth";

jest.mock("@/contexts/AuthContext");
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));
jest.mock("@/api/users");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestQueryWrapper";
  return Wrapper;
};

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe("ProfileSettings", () => {
  const mockRefreshUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state when user data is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      refreshUser: mockRefreshUser,
      isLoading: true,
      isAuthenticated: false,
    });

    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("redirects to 404 when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      refreshUser: mockRefreshUser,
      isLoading: false,
      isAuthenticated: false,
    });

    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders main layout with tabs", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        displayName: "",
        role: UserRole.ADMIN,
        createdAt: new Date("2024-01-01"),
        mustChangePassword: false,
        isActive: true,
        lastLogin: null,
      },
      refreshUser: mockRefreshUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Gerencie suas informações pessoais e configurações de segurança",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /informações pessoais/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /alterar senha/i }),
    ).toBeInTheDocument();
  });

  it("switches between tabs", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        displayName: "",
        role: UserRole.ADMIN,
        createdAt: new Date("2024-01-01"),
        mustChangePassword: false,
        isActive: true,
        lastLogin: null,
      },
      refreshUser: mockRefreshUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ProfileSettings />, { wrapper: createWrapper() });

    // Initially on profile tab
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();

    // Switch to password tab
    const passwordTab = screen.getByRole("button", { name: /alterar senha/i });
    fireEvent.click(passwordTab);

    expect(screen.getByText("Senha Atual *")).toBeInTheDocument();

    // Switch back to profile tab
    const profileTab = screen.getByRole("button", {
      name: /informações pessoais/i,
    });
    fireEvent.click(profileTab);

    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
  });

  it("highlights active tab correctly", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        displayName: "",
        role: UserRole.ADMIN,
        createdAt: new Date("2024-01-01"),
        mustChangePassword: false,
        isActive: true,
        lastLogin: null,
      },
      refreshUser: mockRefreshUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ProfileSettings />, { wrapper: createWrapper() });

    const profileTab = screen.getByRole("button", {
      name: /informações pessoais/i,
    });
    const passwordTab = screen.getByRole("button", { name: /alterar senha/i });

    // Profile tab should be active by default
    expect(profileTab).toHaveClass("border-blue-800");
    expect(passwordTab).toHaveClass("border-transparent");

    // Switch to password tab
    fireEvent.click(passwordTab);

    expect(profileTab).toHaveClass("border-transparent");
    expect(passwordTab).toHaveClass("border-blue-800");
  });
});
