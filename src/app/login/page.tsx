"use client";

import { Suspense } from "react";
import { LoginPageContent } from "@/components/auth/LoginPageContent";

function LoginPageFallback() {
  return (
    <div className="flex min-h-[calc(100vh-110px)] items-center justify-center px-3 py-6">
      <div className="text-gray-500" aria-busy="true">
        Loading…
      </div>
    </div>
  );
}

/**
 * Login Page
 * Redirects to main app if already authenticated.
 * useSearchParams is used in LoginPageContent, wrapped in Suspense for Next.js prerender.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
