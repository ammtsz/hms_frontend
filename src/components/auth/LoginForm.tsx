"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSetCurrentUser } from "@/api/query/hooks/useAuthQueries";
import { loginAction } from "@/app/actions/auth.actions";
import type { LoginFormData } from "@/types/auth";
import { getSafeRedirectPath } from "@/utils/authRedirect";
import { Button, Field, Input } from "@/components/ui";

/**
 * Login Form Component
 * Client component for handling login form submission
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setCurrentUser = useSetCurrentUser();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    // Submit login using server action
    startTransition(async () => {
      const result = await loginAction(formData);

      if (result.success && result.data) {
        setCurrentUser(result.data);

        const returnUrl = searchParams.get("returnUrl");
        // Check if user must change password
        if (result.data.mustChangePassword) {
          router.push("/force-password-change");
        } else {
          // Redirect to returnUrl if present and safe, otherwise attendance
          const redirectPath = getSafeRedirectPath(returnUrl, "/attendance");
          router.push(redirectPath);
        }
        router.refresh(); // Refresh server components to get new user data
      } else {
        // Show error message
        setError(result.error || "Erro ao fazer login");
      }
    });
  };

  return (
    <div className="mx-4 w-full max-w-sm">
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white px-4 py-8 shadow-md sm:px-8 sm:py-10 md:px-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl text-gray-700">Clínica</h2>
          <h1 className="text-3xl text-gray-800">HMS</h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Email Field */}
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isPending}
              placeholder="seu@email.com"
            />
          </Field>

          {/* Password Field */}
          <Field label="Senha" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isPending}
              placeholder="••••••••"
            />
          </Field>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
            loadingText="Entrando..."
            className="w-full bg-blue-800 hover:bg-blue-900"
          >
            Entrar
          </Button>
        </form>

        {/* Dev hint — no hardcoded credentials; use scripts/create-admin.js */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 text-center">
              <strong>Desenvolvimento:</strong> use{" "}
              <code>node scripts/create-admin.js --dev</code> para criar o admin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
