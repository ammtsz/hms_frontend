import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
  changeOwnPassword,
  updateOwnProfile,
} from '@/api/users';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateOwnProfileRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/types/auth';

import { userKeys } from '@/api/query/keys/userKeys';

export function useUsers({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async (): Promise<User[]> => {
      const result = await fetchUsers();
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Error loading users');
      }
      return result.value;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest): Promise<User> => {
      const result = await createUser(data);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Error creating user');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserRequest }): Promise<User> => {
      const result = await updateUser(id, data);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Error updating user');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const result = await deleteUser(id);
      if (!result.success) {
        throw new Error(result.error || 'Error deleting user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<User> => {
      const result = await deactivateUser(id);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Error deactivating user');
      }
      return result.value;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User[]>(userKeys.lists(), (prev) =>
        prev ? prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)) : prev,
      );
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<User> => {
      const result = await reactivateUser(id);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Error reactivating user');
      }
      return result.value;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User[]>(userKeys.lists(), (prev) =>
        prev ? prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)) : prev,
      );
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest): Promise<void> => {
      const result = await resetUserPassword(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset password');
      }
    },
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest): Promise<void> => {
      const result = await changeOwnPassword(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to change password');
      }
    },
  });
}

export function useUpdateOwnProfile() {
  return useMutation({
    mutationFn: async (data: UpdateOwnProfileRequest): Promise<User> => {
      const result = await updateOwnProfile(data);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to update profile');
      }
      return result.value;
    },
  });
}
