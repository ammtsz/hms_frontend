"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChangeOwnPassword } from "@/api/query/hooks/useUserQueries";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { translateErrorMessage } from "@/utils/errorTranslations";
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
      newErrors.currentPassword = "Senha atual é obrigatória";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Nova senha é obrigatória";
    } else if (formData.newPassword.length < 12) {
      newErrors.newPassword = "Nova senha deve ter no mínimo 12 caracteres";
    } else if (
      formData.currentPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      // Only check if passwords are the same when both are non-empty
      newErrors.newPassword = "A nova senha deve ser diferente da atual";
    }

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
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

    setErrors({});

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      await refreshUser();
      router.push("/");
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
              Troca de Senha Obrigatória
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Por motivos de segurança, você deve alterar sua senha antes de
            continuar usando o sistema.
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
              Conectado como:{" "}
              <span className="font-semibold text-gray-900">{user.name}</span>
            </p>
          </div>

          {/* Current Password */}
          <Field label="Senha Atual *" error={errors.currentPassword}>
            <div className="relative">
              <Input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                className="pr-10"
                invalid={Boolean(errors.currentPassword)}
                placeholder="Digite sua senha atual"
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
                    ? "Ocultar senha atual"
                    : "Mostrar senha atual"
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
          <Field label="Nova Senha *" error={errors.newPassword}>
            <div className="relative">
              <Input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="pr-10"
                invalid={Boolean(errors.newPassword)}
                placeholder="Mínimo 12 caracteres"
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
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="pr-10"
                invalid={Boolean(errors.confirmPassword)}
                placeholder="Digite a senha novamente"
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
                    ? "Ocultar confirmação de senha"
                    : "Mostrar confirmação de senha"
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
              Requisitos de Segurança:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Mínimo de 12 caracteres</li>
              <li>• Deve ser diferente da senha atual</li>
              <li>• Recomenda-se usar uma combinação de letras e números</li>
            </ul>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            isLoading={loading}
            loadingText="Alterando Senha..."
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Lock className="h-5 w-5" />
            Alterar Senha e Continuar
          </Button>
        </form>
        </CardBody>

        {/* Footer */}
        <CardFooter className="bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Você não poderá acessar o sistema até alterar sua senha
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
