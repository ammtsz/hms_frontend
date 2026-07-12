/**
 * Authentication Types
 * Type definitions for authentication and user management
 */

export enum UserRole {
  STAFF = "staff",
  ADMIN = "admin",
  DOCTOR = "doctor",
  THERAPIST = "therapist",
}

export interface User {
  id: number;
  email: string;
  name: string;
  displayName?: string | null;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  isDemo?: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ServerActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// User Management Types

export interface CreateUserRequest {
  email: string;
  name: string;
  displayName?: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  displayName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateOwnProfileRequest {
  name?: string; // Admin only
  email?: string; // Admin only
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface ResetPasswordRequest {
  userId: number;
  newPassword: string;
  mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Role labels for UI display
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.STAFF]: "Staff",
  [UserRole.DOCTOR]: "Doctor", // Hidden in UI for now
  [UserRole.THERAPIST]: "Therapist", // Hidden in UI for now
} as const;

// Visible roles in user creation dropdown
export const VISIBLE_ROLES = [UserRole.ADMIN, UserRole.STAFF] as const;
