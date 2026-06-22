import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PersonalDataSettings from "../PersonalDataSettings";
import { useAuth } from "@/contexts/AuthContext";
import { updateOwnProfile } from "@/api/users";
import { UserRole } from "@/types/auth";

jest.mock("@/contexts/AuthContext");
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
const mockUpdateOwnProfile = updateOwnProfile as jest.MockedFunction<
  typeof updateOwnProfile
>;

describe("PersonalDataSettings", () => {
  const mockRefreshUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders personal data form with user information", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        displayName: "Johnny",
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

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Johnny")).toBeInTheDocument();
  });

  it("allows admin users to edit name and email", () => {
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

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const nameInput = screen.getByDisplayValue("John Doe");
    expect(nameInput).not.toBeDisabled();

    const emailInput = screen.getByDisplayValue("john@example.com");
    expect(emailInput).not.toBeDisabled();
  });

  it("prevents non-admin users from editing name and email", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "Staff User",
        email: "staff@example.com",
        displayName: "",
        role: UserRole.STAFF,
        createdAt: new Date("2024-01-01"),
        mustChangePassword: false,
        isActive: true,
        lastLogin: null,
      },
      refreshUser: mockRefreshUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const nameInput = screen.getByDisplayValue("Staff User");
    expect(nameInput).toBeDisabled();

    const emailInput = screen.getByDisplayValue("staff@example.com");
    expect(emailInput).toBeDisabled();
  });

  it("validates required fields for admin users", async () => {
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

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const nameInput = screen.getByDisplayValue("John Doe");
    fireEvent.change(nameInput, { target: { value: "" } });

    const submitButton = screen.getByRole("button", {
      name: /Save Changes/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Full name is required")).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
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

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const emailInput = screen.getByDisplayValue("john@example.com");
    // Must look like an email so type="email" does not block submit before React onSubmit runs
    fireEvent.change(emailInput, { target: { value: "john@notld" } });

    const submitButton = screen.getByRole("button", {
      name: /Save Changes/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });
  });

  it("validates display name max length", async () => {
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

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const displayNameInput = screen.getByPlaceholderText(
      /How you want to be addressed \(optional\)/i,
    );
    fireEvent.change(displayNameInput, {
      target: { value: "A".repeat(51) },
    });

    const submitButton = screen.getByRole("button", {
      name: /Save Changes/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Display name must not exceed 50 characters"),
      ).toBeInTheDocument();
    });
  });

  it("successfully updates profile for admin users", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        displayName: "Johnny",
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

    mockUpdateOwnProfile.mockResolvedValue({
      success: true,
      value: {
        id: 1,
        name: "John Updated",
        email: "john@example.com",
        displayName: "Johnny",
        role: UserRole.ADMIN,
        isActive: true,
        mustChangePassword: false,
        lastLogin: null,
        createdAt: new Date("2024-01-01"),
      },
    });

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const nameInput = screen.getByDisplayValue("John Doe");
    fireEvent.change(nameInput, { target: { value: "John Updated" } });

    const submitButton = screen.getByRole("button", {
      name: /Save Changes/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateOwnProfile).toHaveBeenCalledWith({
        name: "John Updated",
        email: "john@example.com",
        displayName: "Johnny",
      });
    });

    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText("Profile updated successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("successfully updates only display name for staff users", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "Staff User",
        email: "staff@example.com",
        displayName: "",
        role: UserRole.STAFF,
        createdAt: new Date("2024-01-01"),
        mustChangePassword: false,
        isActive: true,
        lastLogin: null,
      },
      refreshUser: mockRefreshUser,
      isLoading: false,
      isAuthenticated: true,
    });

    mockUpdateOwnProfile.mockResolvedValue({
      success: true,
      value: {
        id: 1,
        name: "John Updated",
        email: "john@example.com",
        displayName: "Johnny",
        role: UserRole.ADMIN,
        isActive: true,
        mustChangePassword: false,
        lastLogin: null,
        createdAt: new Date("2024-01-01"),
      },
    });

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const displayNameInput = screen.getByPlaceholderText(
      /How you want to be addressed \(optional\)/i,
    );
    fireEvent.change(displayNameInput, { target: { value: "Staffy" } });

    const submitButton = screen.getByRole("button", {
      name: /Save Changes/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateOwnProfile).toHaveBeenCalledWith({
        displayName: "Staffy",
      });
    });
  });

  it("displays error message on update failure", async () => {
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

    mockUpdateOwnProfile.mockResolvedValue({
      success: false,
      error: "Email already exists",
    });

    render(<PersonalDataSettings />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", {
      name: /Save Changes/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });

  it("returns null when user is not available", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      refreshUser: mockRefreshUser,
      isLoading: false,
      isAuthenticated: false,
    });

    const { container } = render(<PersonalDataSettings />, {
      wrapper: createWrapper(),
    });
    expect(container.firstChild).toBeNull();
  });
});
