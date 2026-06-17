/**
 * User Management API Client
 * All API calls for user CRUD operations
 */

import { apiClient } from '../lib/axios';
import type { ApiResponse } from '../types';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateOwnProfileRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/types/auth';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

/**
 * Get all users (admin only)
 */
export async function fetchUsers(): Promise<ApiResponse<User[]>> {
  try {
    const response = await apiClient.get('/users');
    return {
      success: true,
      value: response.data,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to fetch users',
    };
  }
}

/**
 * Create new user (admin only)
 */
export async function createUser(
  data: CreateUserRequest
): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.post('/users', {
      email: data.email,
      name: data.name,
      display_name: data.displayName,
      password: data.password,
      role: data.role,
      is_active: data.isActive,
      must_change_password: data.mustChangePassword ?? true,
    });
    return {
      success: true,
      value: response.data,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to create user',
    };
  }
}

/**
 * Update user (admin only)
 */
export async function updateUser(
  id: number,
  data: UpdateUserRequest
): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.patch(`/users/${id}`, {
      name: data.name,
      email: data.email,
      display_name: data.displayName,
      role: data.role,
      is_active: data.isActive,
    });
    return {
      success: true,
      value: response.data,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to update user',
    };
  }
}

/**
 * Delete user permanently (admin only)
 */
export async function deleteUser(id: number): Promise<ApiResponse<void>> {
  try {
    await apiClient.delete(`/users/${id}`);
    return {
      success: true,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to delete user',
    };
  }
}

/**
 * Deactivate user (soft delete) (admin only)
 */
export async function deactivateUser(id: number): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.patch(`/users/${id}/deactivate`);
    return {
      success: true,
      value: response.data,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to deactivate user',
    };
  }
}

/**
 * Reactivate user (admin only)
 */
export async function reactivateUser(id: number): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.patch(`/users/${id}/reactivate`);
    return {
      success: true,
      value: response.data,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to reactivate user',
    };
  }
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPassword(
  data: ResetPasswordRequest
): Promise<ApiResponse<void>> {
  try {
    await apiClient.post('/users/reset-password', {
      user_id: data.userId,
      new_password: data.newPassword,
      must_change_password: data.mustChangePassword,
    });
    return {
      success: true,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to reset password',
    };
  }
}

/**
 * Update own profile (any authenticated user)
 */
export async function updateOwnProfile(
  data: UpdateOwnProfileRequest
): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.patch('/users/profile/me', {
      name: data.name,
      email: data.email,
      display_name: data.displayName,
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
    return {
      success: true,
      value: response.data,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to update profile',
    };
  }
}

/**
 * Change own password (any authenticated user)
 */
export async function changeOwnPassword(
  data: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  try {
    await apiClient.post('/users/profile/change-password', {
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
    return {
      success: true,
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      error: apiError.response?.data?.message || 'Failed to change password',
    };
  }
}
