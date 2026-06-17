"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import type { PatientPageSectionId } from "./patientPageSectionConfig";

interface PatientPageScrollTargetContextValue {
  scrollTargetSectionId: PatientPageSectionId | null;
  setScrollTargetSectionId: (id: PatientPageSectionId | null) => void;
}

const PatientPageScrollTargetContext =
  createContext<PatientPageScrollTargetContextValue | null>(null);

export function PatientPageScrollTargetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrollTargetSectionId, setScrollTargetSectionId] =
    useState<PatientPageSectionId | null>(null);

  const value: PatientPageScrollTargetContextValue = {
    scrollTargetSectionId,
    setScrollTargetSectionId: useCallback((id: PatientPageSectionId | null) => {
      setScrollTargetSectionId(id);
    }, []),
  };

  return (
    <PatientPageScrollTargetContext.Provider value={value}>
      {children}
    </PatientPageScrollTargetContext.Provider>
  );
}

export function usePatientPageScrollTarget(): PatientPageScrollTargetContextValue {
  const ctx = useContext(PatientPageScrollTargetContext);
  if (ctx == null) {
    return {
      scrollTargetSectionId: null,
      setScrollTargetSectionId: () => {},
    };
  }
  return ctx;
}
