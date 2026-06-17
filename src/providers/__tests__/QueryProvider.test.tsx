/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryProvider, queryClient } from "../QueryProvider";
import { useQuery } from "@tanstack/react-query";

// Mock ReactQueryDevtools to avoid rendering issues in tests
jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: ({ initialIsOpen }: { initialIsOpen: boolean }) => (
    <div data-testid="react-query-devtools" data-initial-open={initialIsOpen} />
  ),
}));

// Test component that uses React Query
const TestQueryComponent = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["test"],
    queryFn: async () => {
      return "test data";
    },
  });

  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error occurred</div>;
  return <div data-testid="data">{data}</div>;
};

// Test component for retry logic
const TestRetryComponent = ({ shouldFail }: { shouldFail: boolean }) => {
  const { data, error, isLoading, failureCount } = useQuery({
    queryKey: ["retry-test", shouldFail],
    queryFn: async () => {
      if (shouldFail) {
        throw new Error("Test error");
      }
      return "success";
    },
  });

  return (
    <div>
      <div data-testid="failure-count">{failureCount}</div>
      <div data-testid="loading-state">{isLoading.toString()}</div>
      <div data-testid="error-state">{error ? error.message : "no error"}</div>
      <div data-testid="data-state">{data || "no data"}</div>
    </div>
  );
};

describe("QueryProvider", () => {
  beforeEach(() => {
    // Clear all caches before each test
    queryClient.clear();
  });

  describe("Provider Setup", () => {
    it("should render children within QueryClientProvider", () => {
      render(
        <QueryProvider>
          <div data-testid="child-component">Test Child</div>
        </QueryProvider>
      );

      expect(screen.getByTestId("child-component")).toBeInTheDocument();
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("should provide React Query context to child components", async () => {
      render(
        <QueryProvider>
          <TestQueryComponent />
        </QueryProvider>
      );

      // Should start in loading state
      expect(screen.getByTestId("loading")).toBeInTheDocument();

      // Should eventually show data
      await waitFor(() => {
        expect(screen.getByTestId("data")).toBeInTheDocument();
      });

      expect(screen.getByText("test data")).toBeInTheDocument();
    });
  });

  describe("Development Environment", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      // Restore original environment
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    });

    it("should render ReactQueryDevtools in development environment", () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
        configurable: true,
      });

      render(
        <QueryProvider>
          <div>Test Content</div>
        </QueryProvider>
      );

      const devtools = screen.getByTestId("react-query-devtools");
      expect(devtools).toBeInTheDocument();
      expect(devtools).toHaveAttribute("data-initial-open", "false");
    });

    it("should not render ReactQueryDevtools in production environment", () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
        configurable: true,
      });

      render(
        <QueryProvider>
          <div>Test Content</div>
        </QueryProvider>
      );

      expect(
        screen.queryByTestId("react-query-devtools")
      ).not.toBeInTheDocument();
    });

    it("should not render ReactQueryDevtools in test environment", () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "test",
        writable: true,
        configurable: true,
      });

      render(
        <QueryProvider>
          <div>Test Content</div>
        </QueryProvider>
      );

      expect(
        screen.queryByTestId("react-query-devtools")
      ).not.toBeInTheDocument();
    });
  });

  describe("Query Client Configuration", () => {
    it("should be properly configured", () => {
      const defaultOptions = queryClient.getDefaultOptions();

      // Query defaults
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
      expect(defaultOptions.queries?.retry).toBe(1);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);

      // Mutation defaults
      expect(defaultOptions.mutations?.retry).toBe(0);
    });

    it("should have proper retry delay function", () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryDelayFn = defaultOptions.queries?.retryDelay as (
        attemptIndex: number
      ) => number;

      expect(typeof retryDelayFn).toBe("function");

      // Test exponential backoff
      expect(retryDelayFn(0)).toBe(1000); // 1 second for first retry
      expect(retryDelayFn(1)).toBe(2000); // 2 seconds for second retry
      expect(retryDelayFn(2)).toBe(4000); // 4 seconds for third retry
      expect(retryDelayFn(10)).toBe(30000); // Max 30 seconds
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed queries according to configuration", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <QueryProvider>
          <TestRetryComponent shouldFail={true} />
        </QueryProvider>
      );

      // Should eventually show error state after retries
      await waitFor(
        () => {
          expect(screen.getByTestId("error-state")).toHaveTextContent(
            "Test error"
          );
        },
        { timeout: 15000 }
      );

      // Should have attempted retries (exact count may vary due to timing)
      const failureCount = parseInt(
        screen.getByTestId("failure-count").textContent || "0"
      );
      expect(failureCount).toBeGreaterThan(1); // Should have retried at least once
      expect(failureCount).toBeLessThanOrEqual(4); // Should not exceed configured retries

      consoleSpy.mockRestore();
    }, 20000); // Increase timeout for this specific test

    it("should succeed without retries when query works", async () => {
      render(
        <QueryProvider>
          <TestRetryComponent shouldFail={false} />
        </QueryProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("data-state")).toHaveTextContent("success");
      });

      // Should not have any failures
      expect(screen.getByTestId("failure-count")).toHaveTextContent("0");
      expect(screen.getByTestId("error-state")).toHaveTextContent("no error");
    });
  });

  describe("Query Client Export", () => {
    it("should export queryClient instance", () => {
      expect(queryClient).toBeDefined();
      expect(typeof queryClient.clear).toBe("function");
      expect(typeof queryClient.getQueryData).toBe("function");
      expect(typeof queryClient.setQueryData).toBe("function");
    });

    it("should allow direct access to query client", () => {
      const testKey = ["direct-access-test"];
      const testData = "direct access data";

      // Set data directly
      queryClient.setQueryData(testKey, testData);

      // Get data directly
      const retrievedData = queryClient.getQueryData(testKey);
      expect(retrievedData).toBe(testData);
    });
  });

  describe("Error Boundaries", () => {
    it("should handle React Query errors gracefully", async () => {
      const ErrorComponent = () => {
        throw new Error("Component error");
      };

      // Suppress error boundary errors in test output
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Simple error boundary for testing
      class TestErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError() {
          return { hasError: true };
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="error-boundary">Something went wrong</div>;
          }
          return this.props.children;
        }
      }

      render(
        <TestErrorBoundary>
          <QueryProvider>
            <ErrorComponent />
          </QueryProvider>
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("Multiple Children", () => {
    it("should handle multiple child components", async () => {
      render(
        <QueryProvider>
          <div data-testid="child-1">Child 1</div>
          <TestQueryComponent />
          <div data-testid="child-2">Child 2</div>
        </QueryProvider>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("data")).toBeInTheDocument();
      });
    });
  });
});
