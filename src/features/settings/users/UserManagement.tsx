"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import { User, Plus, Edit, Trash2, Power, PowerOff, Key } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { UserRole, ROLE_LABELS, type User as UserType } from "@/types/auth";
import {
  Badge,
  Button,
  IconButton,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  useUsers,
  useDeactivateUser,
  useReactivateUser,
} from "@/api/query/hooks/useUserQueries";
import UserForm from "./UserForm";
import DeleteUserModal from "./DeleteUserModal";
import ResetPasswordModal from "./ResetPasswordModal";
import { UserListCard } from "./UserListCard";

const DISPLAY_LOCALE = "en-US";

export default function UserManagement() {
  const { user: currentUser, isLoading: authLoading } = useAuthContext();
  const { showToast } = useToast();

  const {
    data: users = [],
    isLoading: loading,
    error: queryError,
  } = useUsers({ enabled: currentUser?.role === UserRole.ADMIN });
  const error = queryError ? (queryError as Error).message : null;

  const deactivateUserMutation = useDeactivateUser();
  const reactivateUserMutation = useReactivateUser();

  // Modal states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Filter state
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const handleCreateUser = () => {
    setFormMode("create");
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: UserType) => {
    setFormMode("edit");
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleResetPasswordClick = (user: UserType) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleToggleActive = async (user: UserType) => {
    const actionText = user.isActive ? "deactivated" : "reactivated";
    try {
      if (user.isActive) {
        await deactivateUserMutation.mutateAsync(user.id);
      } else {
        await reactivateUserMutation.mutateAsync(user.id);
      }
      showToast(`User ${actionText} successfully`, "success");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : `Failed to ${user.isActive ? "deactivate" : "reactivate"} user`;
      showToast(msg, "error");
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString(DISPLAY_LOCALE, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const filteredUsers =
    roleFilter === "all"
      ? users
      : users.filter((user) => user.role === roleFilter);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show 404 for non-admin users or unauthenticated users
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    notFound();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={handleCreateUser} className="w-full sm:w-auto">
          <Plus className="h-5 w-5" />
          New User
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label
          htmlFor="role-filter"
          className="text-sm font-medium text-gray-700"
        >
          Filter by role:
        </label>
        <Select
          id="role-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="sm:w-56"
        >
          <option value="all">All</option>
          <option value={UserRole.ADMIN}>Administrator</option>
          <option value={UserRole.STAFF}>Staff</option>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white py-8 text-center text-gray-500 shadow-sm">
          No users found
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden" data-testid="user-list-cards">
            {filteredUsers.map((user) => (
              <UserListCard
                key={user.id}
                user={user}
                currentUserId={currentUser.id}
                onEdit={handleEditUser}
                onDelete={handleDeleteClick}
                onResetPassword={handleResetPasswordClick}
                onToggleActive={handleToggleActive}
                formatDate={formatDate}
              />
            ))}
          </div>

          <TableContainer
            className="hidden shadow-sm md:block"
            data-testid="user-list-table"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Display Name
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Last Login
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="mr-2 h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-gray-500 lg:table-cell">
                      {user.displayName || "-"}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-gray-500 sm:max-w-none sm:whitespace-nowrap">
                      {user.email}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={user.isActive ? "success" : "neutral"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-gray-500 lg:table-cell">
                      {formatDate(user.lastLogin)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <IconButton
                          onClick={() => handleEditUser(user)}
                          tone="primary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleResetPasswordClick(user)}
                          tone="purple"
                          title="Reset password"
                        >
                          <Key className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleToggleActive(user)}
                          tone={user.isActive ? "warning" : "success"}
                          title={user.isActive ? "Deactivate" : "Reactivate"}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(user)}
                          tone="danger"
                          title="Delete"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Modals */}
      {showUserForm && (
        <UserForm
          mode={formMode}
          user={selectedUser}
          users={users}
          onClose={() => setShowUserForm(false)}
          onSuccess={() => setShowUserForm(false)}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => setShowDeleteModal(false)}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => setShowResetPasswordModal(false)}
          onSuccess={() => {
            setShowResetPasswordModal(false);
          }}
        />
      )}
    </div>
  );
}
