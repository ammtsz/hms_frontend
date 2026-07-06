import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TopNavigation } from "../TopNavigation";
import { APP_TAGLINE, APP_TITLE } from "@/config/appBranding";
import { useClinicTimezone } from "@/contexts/ClinicTimezoneContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLogout } from "@/api/query/hooks/useAuthQueries";
import { useRouter } from "next/navigation";
import type { User } from "@/types/auth";
import { ROLE_LABELS, UserRole } from "@/types/auth";
import {
  getTimezoneCityName,
  getTimezoneOffsetString,
} from "@/utils/timezoneUtils";

jest.mock("@/contexts/ClinicTimezoneContext");
const mockUseClinicTimezone = useClinicTimezone as jest.MockedFunction<
  typeof useClinicTimezone
>;

jest.mock("@/contexts/AuthContext");
const mockUseAuthContext = useAuthContext as jest.MockedFunction<
  typeof useAuthContext
>;

jest.mock("@/api/query/hooks/useAuthQueries");
const mockUseLogout = useLogout as jest.MockedFunction<typeof useLogout>;

jest.mock("next/navigation");
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

jest.mock("@/utils/timezoneUtils", () => ({
  getTimezoneCityName: jest.fn(),
  getTimezoneOffsetString: jest.fn(),
}));

const mockGetTimezoneCityName = getTimezoneCityName as jest.MockedFunction<
  typeof getTimezoneCityName
>;
const mockGetTimezoneOffsetString =
  getTimezoneOffsetString as jest.MockedFunction<
    typeof getTimezoneOffsetString
  >;

describe("TopNavigation", () => {
  const mockLogout = jest.fn();
  const mockPush = jest.fn();

  const mockClinicTimezoneValue = {
    clinicTimezone: "America/Vancouver",
  };

  const originalNodeEnv = process.env.NODE_ENV;
  const clinicTimezoneLabelText = "Vancouver (GMT-8)";

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
    mockGetTimezoneCityName.mockReturnValue("Vancouver");
    mockGetTimezoneOffsetString.mockReturnValue("GMT-8");

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

      expect(screen.getByRole("navigation")).toBeInTheDocument();

      expect(
        screen.getByRole("heading", {
          name: APP_TITLE,
        }),
      ).toBeInTheDocument();

      const subtitle = screen.getByText(APP_TAGLINE);
      expect(subtitle).toBeInTheDocument();

      expect(
        screen.getByRole("img", {
          name: APP_TITLE,
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

      expect(screen.getByText("Vancouver (GMT-8)")).toBeInTheDocument();
    });

    it("should show timezone display on desktop but not on mobile", () => {
      render(<TopNavigation />);

      const timezoneText = screen.getByText("Vancouver (GMT-8)");
      expect(timezoneText).toHaveClass("hidden", "sm:inline");
    });

    it("should have title on clinic timezone label", () => {
      render(<TopNavigation />);

      const titleEl = screen.queryByTitle(
        "Clinic timezone (set in environment)",
      );
      expect(titleEl).toBeInTheDocument();
    });

    it("should render Globe icon for timezone display", () => {
      render(<TopNavigation />);

      const timezoneContainer =
        screen.getByText("Vancouver (GMT-8)").parentElement;
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
        screen.queryByTitle("Clinic timezone (set in environment)"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTitle("Clinic timezone (set in environment)"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic HTML structure", () => {
      render(<TopNavigation />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(APP_TITLE);
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
        name: APP_TITLE,
      });
      expect(logo).toBeInTheDocument();
    });

    it("should display app title and subtitle", () => {
      render(<TopNavigation />);

      const title = screen.getByRole("heading", {
        name: APP_TITLE,
      });
      expect(title).toHaveClass(
        "truncate",
        "text-base",
        "text-gray-900",
        "sm:text-xl",
      );

      const subtitle = screen.getByText(APP_TAGLINE);
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
        name: APP_TITLE,
      }).parentElement?.parentElement;
      expect(brandingContainer).toHaveClass("space-x-3");
    });
  });

  describe("Error Handling", () => {
    it("should render when clinic timezone is empty", () => {
      mockUseClinicTimezone.mockReturnValue({
        clinicTimezone: "",
      });

      render(<TopNavigation />);

      expect(
        screen.getByRole("heading", {
          name: APP_TITLE,
        }),
      ).toBeInTheDocument();
    });
  });

  describe("User Menu", () => {
    it("should show user menu button when authenticated", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
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

      expect(screen.queryByTitle("User Menu")).not.toBeInTheDocument();
    });

    it("should open user menu dropdown on click", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      expect(screen.getByText(mockAuthUser.email)).toBeInTheDocument();
      expect(
        screen.getByText(ROLE_LABELS[mockAuthUser.role]),
      ).toBeInTheDocument();
      expect(screen.getByText("Sign out")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("My Profile")).toBeInTheDocument();
      expect(screen.getByText("Manage Users")).toBeInTheDocument();
    });

    it("should close user menu on outside click", async () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      expect(screen.getByText("Sign out")).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
      });
    });

    it("should navigate to settings page when Settings button is clicked", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      const settingsButton = screen.getByText("Settings");
      fireEvent.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith("/settings/system");
    });

    it("should close user menu when navigating to settings", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      const settingsButton = screen.getByText("Settings");
      fireEvent.click(settingsButton);

      expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    });

    it("should call logout when logout button is clicked", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      const logoutButton = screen.getByText("Sign out").closest("button");
      fireEvent.click(logoutButton as Element);

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should disable logout button when logout is pending", () => {
      mockUseLogout.mockReturnValue({
        mutate: mockLogout,
        isPending: true,
      } as unknown as ReturnType<typeof mockUseLogout>);

      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      const loadingEl = screen.getByText("Signing out...");
      expect(loadingEl).toBeInTheDocument();

      const logoutButton = loadingEl?.closest("button");
      expect(logoutButton).toBeDisabled();
    });

    it("should close user menu when user becomes unauthenticated", async () => {
      const { rerender } = render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      expect(screen.getByText("Sign out")).toBeInTheDocument();

      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        refreshUser: jest.fn(),
      });

      rerender(<TopNavigation />);

      await waitFor(() => {
        expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
      });
    });

    it("should have proper styling for Settings button", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      const settingsButton = screen.getByText("Settings").closest("button");
      expect(settingsButton).toHaveClass("hover:bg-gray-50");
      expect(settingsButton).toHaveClass("text-gray-700");
    });

    it("should have proper styling for Logout button", () => {
      render(<TopNavigation />);

      const userButton = screen.getByTitle("User Menu");
      fireEvent.click(userButton);

      const logoutButton = screen.getByText("Sign out").closest("button");
      expect(logoutButton).toHaveClass("hover:bg-red-50");
      expect(logoutButton).toHaveClass("text-red-600");
    });
  });
});
