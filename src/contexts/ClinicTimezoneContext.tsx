"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CLINIC_TIMEZONE } from "@/config/clinicTimezone";
import { getTimezoneOffsetString } from "@/utils/timezoneUtils";
import { getTodayInTimezone } from "@/utils/timezoneDate";

export interface ClinicTimezoneContextValue {
  clinicTimezone: string;
  clinicTimezoneLabel: string;
  clinicToday: string;
}

const ClinicTimezoneContext = createContext<ClinicTimezoneContextValue | undefined>(
  undefined,
);

export function ClinicTimezoneProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useMemo((): ClinicTimezoneContextValue => {
    const offset = getTimezoneOffsetString(CLINIC_TIMEZONE);
    return {
      clinicTimezone: CLINIC_TIMEZONE,
      clinicTimezoneLabel: offset,
      clinicToday: getTodayInTimezone(CLINIC_TIMEZONE),
    };
  }, []);

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
