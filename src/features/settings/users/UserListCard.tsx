"use client";

import React from "react";
import { Edit, Key, Power, PowerOff, Trash2, User } from "lucide-react";
import { ROLE_LABELS, type User as UserType } from "@/types/auth";
import { Badge, IconButton } from "@/components/ui";

export interface UserListCardProps {
  user: UserType;
  currentUserId: number;
  onEdit: (user: UserType) => void;
  onDelete: (user: UserType) => void;
  onResetPassword: (user: UserType) => void;
  onToggleActive: (user: UserType) => void;
  formatDate: (date: Date | null) => string;
}

export function UserListCard({
  user,
  currentUserId,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleActive,
  formatDate,
}: UserListCardProps) {
  const isSelf = user.id === currentUserId;
  const lastLogin = formatDate(user.lastLogin);

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-4"
      data-testid={`user-card-${user.id}`}
    >
      <div className="flex items-start gap-2">
        <User className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold leading-snug text-gray-900">
            {user.name}
          </h3>
          {user.displayName ? (
            <p className="mt-0.5 break-words text-sm text-gray-600">
              {user.displayName}
            </p>
          ) : null}
          <p className="mt-1 break-all text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500">Role</span>
          <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
        </p>
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500">Status</span>
          <Badge variant={user.isActive ? "success" : "neutral"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </p>
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500">Last login</span>
          <span className="font-medium text-gray-800">{lastLogin}</span>
        </p>
      </div>

      <div
        className="mt-3 grid grid-cols-4 gap-1 border-t border-gray-100 pt-3"
        role="group"
        aria-label={`Actions for ${user.name}`}
      >
        <IconButton
          onClick={() => onEdit(user)}
          tone="primary"
          title="Edit"
          aria-label="Edit"
          className="justify-self-center"
        >
          <Edit className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() => onResetPassword(user)}
          tone="purple"
          title="Reset password"
          aria-label="Reset password"
          className="justify-self-center"
        >
          <Key className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() => onToggleActive(user)}
          tone={user.isActive ? "warning" : "success"}
          title={user.isActive ? "Deactivate" : "Reactivate"}
          aria-label={user.isActive ? "Deactivate" : "Reactivate"}
          disabled={isSelf}
          className="justify-self-center"
        >
          {user.isActive ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </IconButton>
        <IconButton
          onClick={() => onDelete(user)}
          tone="danger"
          title="Delete"
          aria-label="Delete"
          disabled={isSelf}
          className="justify-self-center"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </article>
  );
}
