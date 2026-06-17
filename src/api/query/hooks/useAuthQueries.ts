import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/auth';
import { logoutAction } from '@/app/actions/auth.actions';

/**
 * Fetch current user via secure API proxy
 * Uses server-side authentication with HTTP-only cookies
 * No token exposure to client-side JavaScript
 */
async function fetchCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      // Credentials automatically included for same-domain requests
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}

/**
 * Hook to get current authenticated user
 * Uses React Query for caching and automatic refetching
 * 
 * Security: This hook uses refetchOnWindowFocus to detect session changes
 * when users switch tabs, providing better protection against session hijacking
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes - reduced for better session security
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Enable for auth to detect session changes
  });
}

/**
 * Hook that returns a setter for the current-user cache entry.
 * Use after a successful login to seed the cache without waiting for a refetch.
 */
export function useSetCurrentUser() {
  const queryClient = useQueryClient();

  return useCallback(
    (user: User) => {
      queryClient.setQueryData(['auth', 'currentUser'], user);
    },
    [queryClient],
  );
}

/**
 * Hook for logout functionality
 * Clears cache and redirects to login
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Use server action to properly handle cookies
      await logoutAction();
    },
    onSettled: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to login
      router.push('/login');
      router.refresh();
    },
  });
}
