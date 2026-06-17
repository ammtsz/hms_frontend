"use client";

import React, { useState } from "react";
import { useChangeOwnPassword } from "@/api/query/hooks/useUserQueries";
import { Eye, EyeOff, Lock } from "lucide-react";
import { translateErrorMessage } from "@/utils/errorTranslations";
import { Button, Field, IconButton, Input } from "@/components/ui";

export default function PasswordSettings() {
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
      newErrors.currentPassword = "Senha atual é obrigatória";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "Nova senha é obrigatória";
    } else if (passwordData.newPassword.length < 12) {
      newErrors.newPassword = "Nova senha deve ter no mínimo 12 caracteres";
    } else if (
      passwordData.currentPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      // Only check if passwords are the same when both are non-empty
      newErrors.newPassword = "A nova senha deve ser diferente da atual";
    }

    if (
      passwordData.newPassword &&
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
      newErrors.confirmPassword = "As senhas não coincidem";
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
      const translatedError = translateErrorMessage(
        err instanceof Error ? err.message : "Erro ao alterar senha",
      );
      setErrors({ submit: translatedError });
    }
  };

  const getPasswordStrength = (password: string): string => {
    if (password.length === 0) return "";
    if (password.length < 12) return "Fraca";
    if (password.length < 16) return "Média";
    return "Forte";
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Senha alterada com sucesso!
        </div>
      )}

      {/* Current Password */}
      <Field
        label="Senha Atual *"
        error={errors.currentPassword}
      >
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
          placeholder="Digite sua senha atual"
          autoComplete="current-password"
        />
      </Field>

      {/* New Password */}
      <Field label="Nova Senha *" error={errors.newPassword}>
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
            placeholder="Mínimo 12 caracteres"
            autoComplete="new-password"
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
              showPasswords.new ? "Ocultar nova senha" : "Mostrar nova senha"
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
              passwordStrength === "Fraca"
                ? "text-red-600"
                : passwordStrength === "Média"
                  ? "text-yellow-600"
                  : "text-green-600"
            }`}
          >
            Força: {passwordStrength}
          </p>
        )}
      </Field>

      {/* Confirm Password */}
      <Field label="Confirmar Nova Senha *" error={errors.confirmPassword}>
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
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
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
                ? "Ocultar confirmação de senha"
                : "Mostrar confirmação de senha"
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
          loadingText="Alterando..."
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Lock className="h-4 w-4" />
          Alterar Senha
        </Button>
      </div>
    </form>
  );
}
