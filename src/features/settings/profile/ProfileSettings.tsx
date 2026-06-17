"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PersonalDataSettings from "./PersonalDataSettings";
import PasswordSettings from "./PasswordSettings";
import { Button } from "@/components/ui";

export default function ProfileSettings() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl p-3 sm:p-6">
      <div className="rounded-lg bg-white shadow">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-500 mt-1">
            Gerencie suas informações pessoais e configurações de segurança
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex overflow-x-auto border-b border-gray-200"
          role="tablist"
        >
          <Button
            variant="ghost"
            onClick={() => setActiveTab("profile")}
            className={`min-h-[44px] shrink-0 snap-start rounded-none border-b-2 px-4 py-3 hover:bg-transparent sm:px-6 ${
              activeTab === "profile"
                ? "border-blue-800 text-blue-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Informações Pessoais
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("password")}
            className={`min-h-[44px] shrink-0 snap-start rounded-none border-b-2 px-4 py-3 hover:bg-transparent sm:px-6 ${
              activeTab === "password"
                ? "border-blue-800 text-blue-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Alterar Senha
          </Button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && <PersonalDataSettings />}

        {/* Password Tab */}
        {activeTab === "password" && <PasswordSettings />}
      </div>
    </div>
  );
}
