"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { LoginForm } from "./LoginForm";
import { getSafeRedirectPath } from "@/utils/authRedirect";

/**
 * Inner content that uses useSearchParams.
 * Rendered inside Suspense by the login page to satisfy Next.js prerender requirements.
 */
export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const defaultPath = user.mustChangePassword
        ? "/force-password-change"
        : "/attendance";
      const returnUrl = searchParams.get("returnUrl");
      const redirectPath = getSafeRedirectPath(returnUrl, defaultPath);
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, isLoading, router, searchParams]);

  return (
    <div className="flex min-h-[calc(100dvh-110px)] items-center justify-center px-3 py-6 sm:px-4">
      <LoginForm />
    </div>
  );
}
