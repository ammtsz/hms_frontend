"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Globe, LogOut, User, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import appIcon from "@/app/icon.png";
import { useClinicTimezone } from "@/contexts/ClinicTimezoneContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLogout } from "@/api/query/hooks/useAuthQueries";
import { Button } from "@/components/ui";
import {
  getTimezoneCityName,
  getTimezoneOffsetString,
} from "@/utils/timezoneUtils";

/**
 * Top navigation bar component
 * Features app branding on the left and clinic timezone label on the right
 */
export function TopNavigation() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { clinicTimezone } = useClinicTimezone();
  const { user, isAuthenticated } = useAuthContext();
  const { mutate: logout, isPending } = useLogout();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const clinicTimezoneDisplay = `${getTimezoneCityName(clinicTimezone)} (${getTimezoneOffsetString(clinicTimezone)})`;

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const handleNavigateToSettings = () => {
    setShowUserMenu(false);
    router.push("/settings/system");
  };

  const handleNavigateToProfile = () => {
    setShowUserMenu(false);
    router.push("/settings/profile");
  };

  const handleNavigateToUsers = () => {
    setShowUserMenu(false);
    router.push("/settings/users");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    if (!isAuthenticated && showUserMenu) {
      setShowUserMenu(false);
    }
  }, [isAuthenticated, showUserMenu]);

  return (
    <nav className="shrink-0 border-b border-gray-200 bg-white px-3 py-3 shadow-sm sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex min-w-0 items-center space-x-3">
          <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={appIcon}
              alt="Healthcare Management System"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base text-gray-900 sm:text-xl">
              Healthcare Management System
            </h1>
            <p className="hidden text-xs text-gray-500 sm:block">
              Attendance and physiotherapy treatment management system
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center space-x-2 sm:space-x-4">
          {process.env.NODE_ENV === "development" && (
            <div
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600"
              title="Clinic timezone (set in environment)"
            >
              <Globe size={16} className="text-gray-400" aria-hidden />
              <span className="hidden sm:inline">{clinicTimezoneDisplay}</span>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="min-h-[44px] space-x-2 rounded-lg px-3 py-2"
                title="User Menu"
              >
                <User size={18} className="text-gray-600" />
                <span className="hidden sm:inline text-sm text-gray-700 font-medium">
                  {user.displayName || user.name}
                </span>
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || user.name}
                    </p>
                    {user.displayName && (
                      <p className="text-xs text-gray-500">{user.name}</p>
                    )}
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {user.role === "admin" ? "Administrator" : "Staff"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleNavigateToProfile}
                    className="w-full justify-start space-x-2 rounded-none px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Button>

                  {user.role === "admin" && (
                    <Button
                      variant="ghost"
                      onClick={handleNavigateToUsers}
                      className="w-full justify-start space-x-2 rounded-none px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Users size={16} />
                      <span>Manage Users</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleNavigateToSettings}
                    className="w-full justify-start space-x-2 rounded-none px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="w-full justify-start space-x-2 rounded-none px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    <span>{isPending ? "Signing out..." : "Sign out"}</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
