"use client";

import React, { useState } from "react";
import { useChangeOwnPassword } from "@/api/query/hooks/useUserQueries";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock } from "lucide-react";
import {
  normalizePasswordChangeErrorMessage,
  PASSWORD_CHANGE_ERROR_MESSAGES,
} from "@/utils/passwordChangeErrorMessages";
import { Button, Field, IconButton, Input } from "@/components/ui";

const DEMO_PASSWORD_LOCKED_MESSAGE =
  "This is the public demo account. The password is fixed so visitors can always log in with the published credentials.";

export default function PasswordSettings() {
  const { user } = useAuth();
  const isDemoAccount = Boolean(user?.isDemo);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const changePasswordMutation = useChangeOwnPassword();
  const isLoading = changePasswordMutation.isPending;
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 12) {
      newErrors.newPassword = "New password must be at least 12 characters";
    } else if (
      passwordData.currentPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      // Only check if passwords are the same when both are non-empty
      newErrors.newPassword =
        "New password must be different from the current password";
    }

    if (
      passwordData.newPassword &&
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDemoAccount) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSuccess(false);
    setErrors({});

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setIsSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setIsSuccess(false), 3000);
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

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {isDemoAccount && (
        <div
          className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm"
          role="status"
        >
          {DEMO_PASSWORD_LOCKED_MESSAGE}
        </div>
      )}

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Password changed successfully!
        </div>
      )}

      {/* Current Password */}
      <Field label="Current Password *" error={errors.currentPassword}>
        <Input
          type="password"
          value={passwordData.currentPassword}
          onChange={(e) =>
            setPasswordData({
              ...passwordData,
              currentPassword: e.target.value,
            })
          }
          invalid={Boolean(errors.currentPassword)}
          placeholder="Enter your current password"
          autoComplete="current-password"
          disabled={isDemoAccount}
        />
      </Field>

      {/* New Password */}
      <Field label="New Password *" error={errors.newPassword}>
        <div className="relative">
          <Input
            type={showPasswords.new ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                newPassword: e.target.value,
              })
            }
            className="pr-10"
            invalid={Boolean(errors.newPassword)}
            placeholder="Minimum 12 characters"
            autoComplete="new-password"
            disabled={isDemoAccount}
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
              showPasswords.new ? "Hide new password" : "Show new password"
            }
            disabled={isDemoAccount}
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
      <Field label="Confirm New Password *" error={errors.confirmPassword}>
        <div className="relative">
          <Input
            type={showPasswords.confirm ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value,
              })
            }
            className="pr-10"
            invalid={Boolean(errors.confirmPassword)}
            placeholder="Re-enter the password"
            autoComplete="new-password"
            disabled={isDemoAccount}
          />
          <IconButton
            onClick={() =>
              setShowPasswords({
                ...showPasswords,
                confirm: !showPasswords.confirm,
              })
            }
            aria-label={
              showPasswords.confirm
                ? "Hide password confirmation"
                : "Show password confirmation"
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isDemoAccount}
          >
            {showPasswords.confirm ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </IconButton>
        </div>
      </Field>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          isLoading={isLoading}
          loadingText="Changing..."
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isDemoAccount}
        >
          <Lock className="h-4 w-4" />
          Change Password
        </Button>
      </div>
    </form>
  );
}
