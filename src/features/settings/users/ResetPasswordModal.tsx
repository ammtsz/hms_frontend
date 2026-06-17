"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { User } from "@/types/auth";
import { useResetUserPassword } from "@/api/query/hooks/useUserQueries";
import BaseModal from "@/components/common/BaseModal";
import { Button, Checkbox, IconButton, Input } from "@/components/ui";

interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
    mustChangePassword: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const resetPasswordMutation = useResetUserPassword();
  const loading = resetPasswordMutation.isPending;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "Senha é obrigatória";
    } else if (formData.newPassword.length < 12) {
      newErrors.newPassword = "Senha deve ter no mínimo 12 caracteres";
    }

    if (formData.newPassword !== formData.confirmPassword) {
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

    try {
      await resetPasswordMutation.mutateAsync({
        userId: user.id,
        newPassword: formData.newPassword,
        mustChangePassword: formData.mustChangePassword,
      });
      onSuccess();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "Erro ao redefinir senha",
      });
    }
  };

  const getPasswordStrength = (password: string): string => {
    if (password.length === 0) return "";
    if (password.length < 12) return "Fraca";
    if (password.length < 16) return "Média";
    return "Forte";
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Redefinir Senha"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <p className="text-gray-700">
            Redefinir senha para:{" "}
            <span className="font-semibold">{user.name}</span>
          </p>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="pr-10"
                invalid={Boolean(errors.newPassword)}
                placeholder="Mínimo 12 caracteres"
              />
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </IconButton>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
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
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha *
            </label>
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              invalid={Boolean(errors.confirmPassword)}
              placeholder="Digite a senha novamente"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Must Change Password */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="mustChangePassword"
              checked={formData.mustChangePassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mustChangePassword: e.target.checked,
                })
              }
              className="mt-1"
            />
            <label
              htmlFor="mustChangePassword"
              className="text-sm text-gray-700"
            >
              <span className="font-medium">
                Exigir troca de senha no próximo login
              </span>
              <p className="text-gray-500 mt-1">
                O usuário será obrigado a alterar a senha ao fazer login
              </p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              loadingText="Redefinindo..."
            >
              Redefinir Senha
            </Button>
          </div>
      </form>
    </BaseModal>
  );
}
