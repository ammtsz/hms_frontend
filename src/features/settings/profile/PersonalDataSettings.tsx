"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateOwnProfile } from "@/api/query/hooks/useUserQueries";
import { Save } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";

export default function PersonalDataSettings() {
  const { user, refreshUser } = useAuth();
  const isDemoAccount = Boolean(user?.isDemo);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    displayName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const updateProfileMutation = useUpdateOwnProfile();
  const isLoading = updateProfileMutation.isPending;

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        displayName: user.displayName || "",
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Admin-specific validations
    if (user?.role === "admin") {
      if (!profileData.name || profileData.name.trim().length === 0) {
        newErrors.name = "Full name is required";
      } else if (profileData.name.length > 100) {
        newErrors.name = "Full name must not exceed 100 characters";
      }

      if (!profileData.email || profileData.email.trim().length === 0) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
        newErrors.email = "Invalid email";
      }
    }

    if (profileData.displayName && profileData.displayName.length > 50) {
      newErrors.displayName = "Display name must not exceed 50 characters";
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

    const payload: { name?: string; email?: string; displayName?: string } = {
      displayName: profileData.displayName || undefined,
    };

    if (user?.role === "admin") {
      payload.name = profileData.name;
      payload.email = profileData.email;
    }

    try {
      await updateProfileMutation.mutateAsync(payload);
      setIsSuccess(true);
      await refreshUser();
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "Error updating profile",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {isDemoAccount && (
        <div
          className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm"
          role="status"
        >
          This is the public demo account. Profile fields are fixed so the demo
          stays consistent for all visitors.
        </div>
      )}

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Profile updated successfully!
        </div>
      )}

      {/* Name and Email fields - editable for admins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label={`Full Name ${user.role === "admin" ? "*" : ""}`}
          error={errors.name}
          helpText={
            user.role !== "admin"
              ? "Only administrators can change this field"
              : undefined
          }
        >
          <Input
            type="text"
            value={user.role === "admin" ? profileData.name : user.name}
            onChange={(e) =>
              user.role === "admin" &&
              setProfileData({
                ...profileData,
                name: e.target.value,
              })
            }
            disabled={user.role !== "admin" || isDemoAccount}
            invalid={Boolean(errors.name)}
            maxLength={100}
          />
        </Field>

        <Field
          label={`Email ${user.role === "admin" ? "*" : ""}`}
          error={errors.email}
          helpText={
            user.role !== "admin"
              ? "Only administrators can change this field"
              : undefined
          }
        >
          <Input
            type="email"
            value={user.role === "admin" ? profileData.email : user.email}
            onChange={(e) =>
              user.role === "admin" &&
              setProfileData({
                ...profileData,
                email: e.target.value,
              })
            }
            disabled={user.role !== "admin" || isDemoAccount}
            invalid={Boolean(errors.email)}
          />
        </Field>
      </div>

      {/* Editable Display Name */}
      <Field
        label="Display Name"
        error={errors.displayName}
        helpText={
          isDemoAccount
            ? "Display name cannot be changed on the public demo account"
            : "This name will be shown in the system instead of your full name"
        }
      >
        <Input
          type="text"
          value={profileData.displayName}
          onChange={(e) =>
            setProfileData({
              ...profileData,
              displayName: e.target.value,
            })
          }
          invalid={Boolean(errors.displayName)}
          placeholder="How you want to be addressed (optional)"
          maxLength={50}
          disabled={isDemoAccount}
        />
      </Field>

      {/* Role (read-only) */}
      <Field label="Role">
        <Input
          type="text"
          value={
            user.role === "admin"
              ? "Administrator"
              : user.role === "staff"
                ? "Staff"
                : user.role
          }
          disabled
        />
      </Field>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          isLoading={isLoading}
          loadingText="Saving..."
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isDemoAccount}
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
