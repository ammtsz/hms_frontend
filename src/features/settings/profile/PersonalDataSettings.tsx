"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateOwnProfile } from "@/api/query/hooks/useUserQueries";
import { Save } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";

export default function PersonalDataSettings() {
  const { user, refreshUser } = useAuth();

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
        newErrors.name = "Nome completo é obrigatório";
      } else if (profileData.name.length > 100) {
        newErrors.name = "Nome completo deve ter no máximo 100 caracteres";
      }

      if (!profileData.email || profileData.email.trim().length === 0) {
        newErrors.email = "Email é obrigatório";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
        newErrors.email = "Email inválido";
      }
    }

    if (profileData.displayName && profileData.displayName.length > 50) {
      newErrors.displayName =
        "Nome de exibição deve ter no máximo 50 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        submit: err instanceof Error ? err.message : "Erro ao atualizar perfil",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* Name and Email fields - editable for admins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label={`Nome Completo ${user.role === "admin" ? "*" : ""}`}
          error={errors.name}
          helpText={
            user.role !== "admin"
              ? "Apenas administradores podem alterar este campo"
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
            disabled={user.role !== "admin"}
            invalid={Boolean(errors.name)}
            maxLength={100}
          />
        </Field>

        <Field
          label={`Email ${user.role === "admin" ? "*" : ""}`}
          error={errors.email}
          helpText={
            user.role !== "admin"
              ? "Apenas administradores podem alterar este campo"
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
            disabled={user.role !== "admin"}
            invalid={Boolean(errors.email)}
          />
        </Field>
      </div>

      {/* Editable Display Name */}
      <Field
        label="Nome de Exibição"
        error={errors.displayName}
        helpText="Este nome será exibido no sistema ao invés do seu nome completo"
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
          placeholder="Como você deseja ser chamado (opcional)"
          maxLength={50}
        />
      </Field>

      {/* Role (read-only) */}
      <Field label="Função">
        <Input
          type="text"
          value={
            user.role === "admin"
              ? "Administrador"
              : user.role === "staff"
                ? "Colaborador"
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
          loadingText="Salvando..."
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
