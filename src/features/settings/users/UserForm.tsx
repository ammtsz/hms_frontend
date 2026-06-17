"use client";

import React, { useState, useEffect } from "react";
import { UserRole, VISIBLE_ROLES, ROLE_LABELS, type User } from "@/types/auth";
import { useCreateUser, useUpdateUser } from "@/api/query/hooks/useUserQueries";
import BaseModal from "@/components/common/BaseModal";
import { Button, Checkbox, Input, Select } from "@/components/ui";

interface UserFormProps {
  mode: "create" | "edit";
  user: User | null;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserForm({
  mode,
  user,
  users,
  onClose,
  onSuccess,
}: UserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    role: UserRole.STAFF,
    isActive: true,
    mustChangePassword: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const loading = createUserMutation.isPending || updateUserMutation.isPending;

  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        name: user.name,
        email: user.email,
        displayName: user.displayName || "",
        password: "",
        confirmPassword: "",
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      });
    }
  }, [mode, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (mode === "create") {
      if (!formData.password) {
        newErrors.password = "Senha é obrigatória";
      } else if (formData.password.length < 12) {
        newErrors.password = "Senha deve ter no mínimo 12 caracteres";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "As senhas não coincidem";
      }
    }

    // Prevent changing the last admin to another role
    if (mode === "edit" && user) {
      const adminCount = users.filter((u) => u.role === UserRole.ADMIN).length;
      const isChangingFromAdmin =
        user.role === UserRole.ADMIN && formData.role !== UserRole.ADMIN;

      if (isChangingFromAdmin && adminCount <= 1) {
        newErrors.role =
          "Não é possível alterar a função do último administrador";
      }
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
      if (mode === "create") {
        await createUserMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          displayName: formData.displayName || undefined,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive,
          mustChangePassword: formData.mustChangePassword,
        });
        onSuccess();
      } else if (user) {
        await updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            name: formData.name,
            email: formData.email,
            displayName: formData.displayName || undefined,
            role: formData.role,
            isActive: formData.isActive,
          },
        });
        onSuccess();
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro inesperado";
      setErrors({ submit: msg });
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={mode === "create" ? "Novo Usuário" : "Editar Usuário"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome Completo *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              invalid={Boolean(errors.name)}
              placeholder="João Silva"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome de Exibição
            </label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              placeholder="Dr. João"
            />
            <p className="mt-1 text-xs text-gray-500">
              Nome mostrado na interface (opcional)
            </p>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              invalid={Boolean(errors.email)}
              placeholder="joao@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password (only for create mode) */}
          {mode === "create" && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Senha *
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  invalid={Boolean(errors.password)}
                  placeholder="Mínimo 12 caracteres"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirmar Senha *
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
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
              <div className="flex items-center">
                <Checkbox
                  id="mustChangePassword"
                  checked={formData.mustChangePassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mustChangePassword: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="mustChangePassword"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Exigir troca de senha no próximo login
                </label>
              </div>
            </>
          )}

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Função *
            </label>
            <Select
              id="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as UserRole })
              }
              invalid={Boolean(errors.role)}
            >
              {VISIBLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-700"
            >
              Conta ativa
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
              loadingText="Salvando..."
            >
              {mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </div>
      </form>
    </BaseModal>
  );
}
