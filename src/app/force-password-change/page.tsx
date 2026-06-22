"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChangeOwnPassword } from "@/api/query/hooks/useUserQueries";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import {
  normalizePasswordChangeErrorMessage,
  PASSWORD_CHANGE_ERROR_MESSAGES,
} from "@/utils/passwordChangeErrorMessages";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Field,
  IconButton,
  Input,
} from "@/components/ui";

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const changePasswordMutation = useChangeOwnPassword();
  const loading = changePasswordMutation.isPending;
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 12) {
      newErrors.newPassword =
        "New password must be at least 12 characters long";
    } else if (
      formData.currentPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      // Only check if passwords are the same when both are non-empty
      newErrors.newPassword =
        "The new password must be different from the current password";
    }

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setErrors({});

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      await refreshUser();
      router.push("/");
    } catch (err) {
      const normalizedError = normalizePasswordChangeErrorMessage(
        err instanceof Error
          ? err.message
          : PASSWORD_CHANGE_ERROR_MESSAGES.defaultSubmitError,
      );
      setErrors({ submit: normalizedError });
    }
  };

  const getPasswordStrength = (password: string): string => {
    if (password.length === 0) return "";
    if (password.length < 12) return "Weak";
    if (password.length < 16) return "Medium";
    return "Strong";
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  // If user is not logged in or doesn't need to change password, redirect
  React.useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!user.mustChangePassword) {
      router.push("/");
    }
  }, [user, router]);

  if (!user || !user.mustChangePassword) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        {/* Header */}
        <CardHeader className="bg-yellow-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Force Password Change
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            For security reasons, you must change your password before
            continuing to use the system.
          </p>
        </CardHeader>

        {/* Form */}
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            {/* User Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Connected as:{" "}
                <span className="font-semibold text-gray-900">{user.name}</span>
              </p>
            </div>

            {/* Current Password */}
            <Field label="Current Password *" error={errors.currentPassword}>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="pr-10"
                  invalid={Boolean(errors.currentPassword)}
                  placeholder="Enter your current password"
                  autoFocus
                />
                <IconButton
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPasswords.current
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </IconButton>
              </div>
            </Field>

            {/* New Password */}
            <Field label="New Password *" error={errors.newPassword}>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="pr-10"
                  invalid={Boolean(errors.newPassword)}
                  placeholder="At least 12 characters"
                />
                <IconButton
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPasswords.new
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </IconButton>
              </div>
              {passwordStrength && !errors.newPassword && (
                <p
                  className={`mt-1 text-sm ${
                    passwordStrength === "Weak"
                      ? "text-red-600"
                      : passwordStrength === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  Strength: {passwordStrength}
                </p>
              )}
            </Field>

            {/* Confirm Password */}
            <Field
              label="Confirm New Password *"
              error={errors.confirmPassword}
            >
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pr-10"
                  invalid={Boolean(errors.confirmPassword)}
                  placeholder="Enter the new password again"
                />
                <IconButton
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPasswords.confirm
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </IconButton>
              </div>
            </Field>

            {/* Security Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">
                Security Requirements:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Minimum of 12 characters</li>
                <li>• Must be different from the current password</li>
                <li>
                  • It is recommended to use a combination of letters and
                  numbers
                </li>
              </ul>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              loadingText="Changing Password..."
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Lock className="h-5 w-5" />
              Change Password and Continue
            </Button>
          </form>
        </CardBody>

        {/* Footer */}
        <CardFooter className="bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            You will not be able to access the system until you change your
            password
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
