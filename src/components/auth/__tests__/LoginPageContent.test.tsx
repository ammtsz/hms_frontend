/**
 * Unit tests for LoginPageContent
 * Covers redirect when authenticated and form display when not
 */

import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPageContent } from "../LoginPageContent";
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

describe("LoginPageContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it("does not redirect when not authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    render(<LoginPageContent />, { wrapper });

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

    render(<LoginPageContent />, { wrapper });

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

    render(<LoginPageContent />, { wrapper });

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

    render(<LoginPageContent />, { wrapper });

    expect(mockReplace).toHaveBeenCalledWith("/force-password-change");
  });

  it("renders LoginForm when not authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    const { container } = render(<LoginPageContent />, { wrapper });

    expect(container.querySelector("form")).toBeInTheDocument();
  });
});
