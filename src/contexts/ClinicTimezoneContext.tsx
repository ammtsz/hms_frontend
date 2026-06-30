"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CLINIC_TIMEZONE } from "@/config/clinicTimezone";

export interface ClinicTimezoneContextValue {
  clinicTimezone: string;
}

const ClinicTimezoneContext = createContext<ClinicTimezoneContextValue | undefined>(
  undefined,
);

export function ClinicTimezoneProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useMemo(
    (): ClinicTimezoneContextValue => ({
      clinicTimezone: CLINIC_TIMEZONE,
    }),
    [],
  );

  return (
    <ClinicTimezoneContext.Provider value={value}>
      {children}
    </ClinicTimezoneContext.Provider>
  );
}

export function useClinicTimezone(): ClinicTimezoneContextValue {
  const context = useContext(ClinicTimezoneContext);
  if (context === undefined) {
    throw new Error("useClinicTimezone must be used within a ClinicTimezoneProvider");
  }
  return context;
}
