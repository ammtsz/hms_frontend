import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UserManagement from "../UserManagement";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { notFound } from "next/navigation";
import { fetchUsers } from "@/api/users";

jest.mock("@/contexts/AuthContext");
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({
    toasts: [],
    showToast: jest.fn(),
    removeToast: jest.fn(),
  }),
}));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));
jest.mock("@/api/users", () => ({
  fetchUsers: jest.fn(),
  deleteUser: jest.fn(),
  deactivateUser: jest.fn(),
  reactivateUser: jest.fn(),
}));

const mockUseAuthContext = useAuthContext as jest.MockedFunction<
  typeof useAuthContext
>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockFetchUsers = fetchUsers as jest.MockedFunction<typeof fetchUsers>;

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

describe("UserManagement", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display loading message when auth is loading", () => {
    mockUseAuthContext.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      refreshUser: jest.fn(),
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("should call notFound when user is not authenticated", () => {
    mockUseAuthContext.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      refreshUser: jest.fn(),
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should call notFound when user is not an admin", () => {
    mockUseAuthContext.mockReturnValue({
      user: {
        id: 1,
        name: "Staff User",
        email: "staff@example.com",
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

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should render for admin users", () => {
    mockFetchUsers.mockResolvedValue({
      success: true,
      value: [],
    });

    mockUseAuthContext.mockReturnValue({
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
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

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(mockNotFound).not.toHaveBeenCalled();
    expect(screen.getByText("Carregando usuários...")).toBeInTheDocument();
  });
});
