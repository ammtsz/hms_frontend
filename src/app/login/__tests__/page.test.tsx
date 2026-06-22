/**
 * Unit tests for Login Page
 * Tests redirect when already authenticated and returnUrl handling
 */

import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "../page";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

jest.mock("next/navigation");
jest.mock("@/contexts/AuthContext");

const mockReplace = jest.fn();

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it("does not redirect while auth is loading", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: true,
    });

    render(<LoginPage />, { wrapper });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when not authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    render(<LoginPage />, { wrapper });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to /attendance when authenticated and no returnUrl", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        mustChangePassword: false,
      },
      isLoading: false,
    });

    render(<LoginPage />, { wrapper });

    expect(mockReplace).toHaveBeenCalledWith("/attendance");
  });

  it("redirects to returnUrl when authenticated with returnUrl in query", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ returnUrl: "/schedule" }),
    );
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        mustChangePassword: false,
      },
      isLoading: false,
    });

    render(<LoginPage />, { wrapper });

    expect(mockReplace).toHaveBeenCalledWith("/schedule");
  });

  it("redirects to /force-password-change when user must change password", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        mustChangePassword: true,
      },
      isLoading: false,
    });

    render(<LoginPage />, { wrapper });

    expect(mockReplace).toHaveBeenCalledWith("/force-password-change");
  });

  it("uses returnUrl when authenticated and mustChangePassword is false even with returnUrl", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ returnUrl: "/patients" }),
    );
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        mustChangePassword: false,
      },
      isLoading: false,
    });

    render(<LoginPage />, { wrapper });

    expect(mockReplace).toHaveBeenCalledWith("/patients");
  });

  it("falls back to default path when returnUrl is unsafe", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ returnUrl: "//evil.com/path" }),
    );
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        mustChangePassword: false,
      },
      isLoading: false,
    });

    render(<LoginPage />, { wrapper });

    expect(mockReplace).toHaveBeenCalledWith("/attendance");
  });

  it("renders LoginForm when not authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    const { container } = render(<LoginPage />, { wrapper });

    expect(container.querySelector("form")).toBeInTheDocument();
  });
});
