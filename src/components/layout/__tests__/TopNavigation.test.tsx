import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TopNavigation } from "../TopNavigation";
import { useClinicTimezone } from "@/contexts/ClinicTimezoneContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLogout } from "@/api/query/hooks/useAuthQueries";
import { useRouter } from "next/navigation";
import type { User } from "@/types/auth";
import { ROLE_LABELS, UserRole } from "@/types/auth";

jest.mock("@/contexts/ClinicTimezoneContext");
const mockUseClinicTimezone = useClinicTimezone as jest.MockedFunction<
  typeof useClinicTimezone
>;

// Mock AuthContext
jest.mock("@/contexts/AuthContext");
const mockUseAuthContext = useAuthContext as jest.MockedFunction<
  typeof useAuthContext
>;

// Mock useLogout hook
jest.mock("@/api/query/hooks/useAuthQueries");
const mockUseLogout = useLogout as jest.MockedFunction<typeof useLogout>;

// Mock Next.js router
jest.mock("next/navigation");
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("TopNavigation", () => {
  const mockLogout = jest.fn();
  const mockPush = jest.fn();

  const mockClinicTimezoneValue = {
    clinicTimezone: "America/Sao_Paulo",
    clinicTimezoneLabel: "GMT-3",
    clinicToday: "2024-01-15",
  };

  const originalNodeEnv = process.env.NODE_ENV;
  const clinicTimezoneLabelText = "São Paulo (GMT-3)";

  const mockAuthUser: User = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    displayName: null,
    role: UserRole.ADMIN,
    isActive: true,
    mustChangePassword: false,
    lastLogin: new Date("2024-01-15T10:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    mockUseClinicTimezone.mockReturnValue(mockClinicTimezoneValue);

    mockUseAuthContext.mockReturnValue({
      user: mockAuthUser,
      isAuthenticated: true,
      isLoading: false,
      refreshUser: jest.fn(),
    });

    mockUseLogout.mockReturnValue({
      mutate: mockLogout,
      isPending: false,
    } as unknown as ReturnType<typeof mockUseLogout>);

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as unknown as ReturnType<typeof mockUseRouter>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the complete navigation structure", () => {
      render(<TopNavigation />);

      // Check main navigation element
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      // Check app branding
      expect(
        screen.getByRole("heading", {
          name: "Healthcare Management System",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Sistema de gestão de atendimentos e tratamentos fisioterapêuticos",
        ),
      ).toBeInTheDocument();

      // Check app logo/icon
      expect(
        screen.getByRole("img", {
          name: "Healthcare Management System",
        }),
      ).toBeInTheDocument();
    });

    it("should have proper CSS classes for styling", () => {
      render(<TopNavigation />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("bg-white", "border-b", "border-gray-200");

      const container = nav.querySelector(".max-w-7xl");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("mx-auto");
    });
  });

  describe("Clinic timezone display (development only)", () => {
    beforeEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        configurable: true,
      });
    });

    it("should show read-only clinic timezone label", () => {
      render(<TopNavigation />);

      expect(screen.getByText(clinicTimezoneLabelText)).toBeInTheDocument();
    });

    it("should show timezone display on desktop but not on mobile", () => {
      render(<TopNavigation />);

      const timezoneText = screen.getByText(clinicTimezoneLabelText);
      expect(timezoneText).toHaveClass("hidden", "sm:inline");
    });

    it("should have title on clinic timezone label", () => {
      render(<TopNavigation />);

      expect(
        screen.getByTitle("Fuso horário da clínica (configurado no ambiente)"),
      ).toBeInTheDocument();
    });

    it("should render Globe icon for timezone display", () => {
      render(<TopNavigation />);

      const timezoneContainer = screen.getByText(
        clinicTimezoneLabelText,
      ).parentElement;
      expect(timezoneContainer).toHaveClass(
        "flex",
        "items-center",
        "space-x-2",
      );
    });

    it("should not show clinic timezone in production", () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        configurable: true,
      });

      render(<TopNavigation />);

      expect(
        screen.queryByText(clinicTimezoneLabelText),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTitle(
          "Fuso horário da clínica (configurado no ambiente)",
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic HTML structure", () => {
      render(<TopNavigation />);

      // Should use proper nav element
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      // Should have proper heading structure
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Healthcare Management System");
    });
  });

  describe("Responsive Design", () => {
    it("should maintain proper spacing and layout classes", () => {
      render(<TopNavigation />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("px-3", "py-3", "sm:px-6", "sm:py-4");

      const container = nav.querySelector(".flex.items-center.justify-between");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Branding Elements", () => {
    it("should display app logo with correct styling", () => {
      render(<TopNavigation />);

      const logo = screen.getByRole("img", {
        name: "Healthcare Management System",
      });
      expect(logo).toBeInTheDocument();
    });

    it("should display app title and subtitle", () => {
      render(<TopNavigation />);

      const title = screen.getByRole("heading", {
        name: "Healthcare Management System",
      });
      expect(title).toHaveClass(
        "truncate",
        "text-base",
        "text-gray-900",
        "sm:text-xl",
      );

      const subtitle = screen.getByText(
        "Sistema de gestão de atendimentos e tratamentos fisioterapêuticos",
      );
      expect(subtitle).toHaveClass(
        "hidden",
        "text-xs",
        "text-gray-500",
        "sm:block",
      );
    });

    it("should have proper spacing between branding elements", () => {
      render(<TopNavigation />);

      const brandingContainer = screen.getByRole("heading", {
        name: "Healthcare Management System",
      }).parentElement?.parentElement;
      expect(brandingContainer).toHaveClass("space-x-3");
    });
  });

  describe("Error Handling", () => {
    it("should render when clinic timezone is empty", () => {
      mockUseClinicTimezone.mockReturnValue({
        clinicTimezone: "",
        clinicTimezoneLabel: "GMT",
        clinicToday: "2024-01-15",
      });

      render(<TopNavigation />);

      expect(
        screen.getByRole("heading", {
          name: "Healthcare Management System",
        }),
      ).toBeInTheDocument();
    });
  });

  describe("User Menu", () => {
    it("should show user menu button when authenticated", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("Menu do Usuário");
      expect(userButton).toBeInTheDocument();
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    it("should not show user menu when not authenticated", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        refreshUser: jest.fn(),
      });

      render(<TopNavigation />);

      expect(screen.queryByTitle("Menu do Usuário")).not.toBeInTheDocument();
    });

    it("should open user menu dropdown on click", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      expect(screen.getByText(mockAuthUser.email)).toBeInTheDocument();
      expect(
        screen.getByText(ROLE_LABELS[mockAuthUser.role]),
      ).toBeInTheDocument();
      expect(screen.getByText("Sair")).toBeInTheDocument();
      expect(screen.getByText("Configurações")).toBeInTheDocument();
    });

    it("should close user menu on outside click", async () => {
      render(<TopNavigation />);

      // Open menu
      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      expect(screen.getByText("Sair")).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Sair")).not.toBeInTheDocument();
      });
    });

    it("should navigate to settings page when Settings button is clicked", () => {
      render(<TopNavigation />);

      // Open user menu
      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      // Click Settings button
      const settingsButton = screen.getByText("Configurações");
      fireEvent.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith("/settings/system");
    });

    it("should close user menu when navigating to settings", () => {
      render(<TopNavigation />);

      // Open user menu
      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      expect(screen.getByText("Configurações")).toBeInTheDocument();

      // Click Settings button
      const settingsButton = screen.getByText("Configurações");
      fireEvent.click(settingsButton);

      // Menu should be closed
      expect(screen.queryByText("Sair")).not.toBeInTheDocument();
    });

    it("should call logout when logout button is clicked", () => {
      render(<TopNavigation />);

      // Open user menu
      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      // Click logout button
      const logoutButton = screen.getByText("Sair");
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should disable logout button when logout is pending", () => {
      mockUseLogout.mockReturnValue({
        mutate: mockLogout,
        isPending: true,
      } as unknown as ReturnType<typeof mockUseLogout>);

      render(<TopNavigation />);

      // Open user menu
      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      // Logout button should show loading state
      expect(screen.getByText("Saindo...")).toBeInTheDocument();

      const logoutButton = screen.getByText("Saindo...").closest("button");
      expect(logoutButton).toBeDisabled();
    });

    it("should close user menu when user becomes unauthenticated", async () => {
      const { rerender } = render(<TopNavigation />);

      // Open user menu
      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      expect(screen.getByText("Sair")).toBeInTheDocument();

      // User becomes unauthenticated
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        refreshUser: jest.fn(),
      });

      rerender(<TopNavigation />);

      await waitFor(() => {
        expect(screen.queryByText("Sair")).not.toBeInTheDocument();
      });
    });

    it("should have proper styling for Settings button", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      const settingsButton = screen
        .getByText("Configurações")
        .closest("button");
      expect(settingsButton).toHaveClass("hover:bg-gray-50");
      expect(settingsButton).toHaveClass("text-gray-700");
    });

    it("should have proper styling for Logout button", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("Menu do Usuário");
      fireEvent.click(userButton);

      const logoutButton = screen.getByText("Sair").closest("button");
      expect(logoutButton).toHaveClass("hover:bg-red-50");
      expect(logoutButton).toHaveClass("text-red-600");
    });
  });
});
