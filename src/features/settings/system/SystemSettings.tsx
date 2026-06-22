"use client";

import React, { useState, useEffect } from "react";
import TreatmentOptionsList from "./TreatmentOptionsList";
import { SystemOptionType } from "@/types/systemOptions";
import PriorityManagementList from "./PriorityManagementList";
import NoteCategoriesManagementList from "./NoteCategoriesManagementList";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  SectionDisclosure,
} from "@/components/ui";
import {
  useAppointmentsThreshold,
  useUpdateAppointmentsThreshold,
} from "@/api/query/hooks/useAppointmentsThresholdQueries";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { UserRole } from "@/types/auth";
import {
  SYSTEM_SETTINGS_LABELS,
  SYSTEM_SETTINGS_MIN_THRESHOLD,
  SYSTEM_SETTINGS_MAX_THRESHOLD,
} from "./systemSettingsLabels";

const MIN_THRESHOLD = SYSTEM_SETTINGS_MIN_THRESHOLD;
const MAX_THRESHOLD = SYSTEM_SETTINGS_MAX_THRESHOLD;
const DEFAULT_THRESHOLD = 3;

function stringifyThreshold(n: number): string {
  return String(n);
}

export default function SystemSettings() {
  const [bodyLocationsExpanded, setBodyLocationsExpanded] = useState(false);
  const [colorsExpanded, setColorsExpanded] = useState(false);
  const [prioritiesExpanded, setPrioritiesExpanded] = useState(false);
  const [noteCategoriesExpanded, setNoteCategoriesExpanded] = useState(false);
  const [thresholdExpanded, setThresholdExpanded] = useState(false);
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const isAdmin = user?.role === UserRole.ADMIN;

  const { data: thresholdData, isLoading: thresholdLoading } =
    useAppointmentsThreshold();
  const updateThreshold = useUpdateAppointmentsThreshold();

  const serverValue =
    thresholdData?.missingAppointmentsThreshold ?? DEFAULT_THRESHOLD;
  const [localValue, setLocalValue] = useState(stringifyThreshold(serverValue));

  useEffect(() => {
    setLocalValue(stringifyThreshold(serverValue));
  }, [serverValue]);

  const numValue = Number(localValue);
  const thresholdValid =
    localValue !== "" &&
    !Number.isNaN(numValue) &&
    numValue >= MIN_THRESHOLD &&
    numValue <= MAX_THRESHOLD;
  const thresholdChanged = thresholdValid && numValue !== serverValue;

  const handleSaveThreshold = () => {
    if (!thresholdValid) return;
    updateThreshold.mutate(numValue, {
      onSuccess: () => {
        showToast(SYSTEM_SETTINGS_LABELS.configUpdatedToast, "success");
      },
      onError: (err) => {
        showToast(
          err instanceof Error ? err.message : "Error saving configuration",
          "error",
        );
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-3 sm:p-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-gray-900">
            {SYSTEM_SETTINGS_LABELS.pageTitle}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {SYSTEM_SETTINGS_LABELS.pageDescription}
          </p>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Missing Appointments Threshold Section */}
          <SectionDisclosure
            title={SYSTEM_SETTINGS_LABELS.missingAppointmentsThreshold}
            isOpen={thresholdExpanded}
            onToggle={() => setThresholdExpanded(!thresholdExpanded)}
            bodyClassName="space-y-3"
          >
            <p className="text-sm text-gray-600">
              Define how many consecutive missed appointments without
              justification will lead to the patient being marked with the F
              (Missing Appointments) status.
            </p>
            {thresholdLoading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="appointments-threshold" className="sr-only">
                    Missing Appointments Threshold (1 to 10)
                  </label>
                  <Input
                    id="appointments-threshold"
                    type="number"
                    min={MIN_THRESHOLD}
                    max={MAX_THRESHOLD}
                    step={1}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    disabled={!isAdmin}
                    className="w-24"
                    aria-invalid={localValue !== "" && !thresholdValid}
                  />
                  <Button
                    onClick={handleSaveThreshold}
                    disabled={
                      !isAdmin || !thresholdChanged || updateThreshold.isPending
                    }
                    isLoading={updateThreshold.isPending}
                    loadingText="Saving..."
                    className="w-full sm:w-auto"
                  >
                    Save
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  The current value is {serverValue}. When the patient reaches
                  this number of consecutive missed appointments without
                  justification, the system will change the status to F (Missing
                  Appointments) and cancel future appointments.
                </p>
                {!isAdmin && (
                  <p className="text-sm text-amber-700">
                    {SYSTEM_SETTINGS_LABELS.adminOnlyThreshold}
                  </p>
                )}
                {localValue !== "" && !thresholdValid && (
                  <p className="text-sm text-red-600" role="alert">
                    {SYSTEM_SETTINGS_LABELS.thresholdValidation}
                  </p>
                )}
              </>
            )}
          </SectionDisclosure>

          {/* Priorities Section */}
          <SectionDisclosure
            title={SYSTEM_SETTINGS_LABELS.priorities}
            isOpen={prioritiesExpanded}
            onToggle={() => setPrioritiesExpanded(!prioritiesExpanded)}
          >
            <PriorityManagementList />
          </SectionDisclosure>

          {/* Note Categories Section */}
          <SectionDisclosure
            title={SYSTEM_SETTINGS_LABELS.noteCategories}
            isOpen={noteCategoriesExpanded}
            onToggle={() => setNoteCategoriesExpanded(!noteCategoriesExpanded)}
          >
            <NoteCategoriesManagementList />
          </SectionDisclosure>

          {/* Body Locations Section */}
          <SectionDisclosure
            title={SYSTEM_SETTINGS_LABELS.bodyLocations}
            isOpen={bodyLocationsExpanded}
            onToggle={() => setBodyLocationsExpanded(!bodyLocationsExpanded)}
          >
            <TreatmentOptionsList type={SystemOptionType.BODY_LOCATION} />
          </SectionDisclosure>

          {/* Colors Section */}
          <SectionDisclosure
            title={SYSTEM_SETTINGS_LABELS.colorsPhysiotherapy}
            isOpen={colorsExpanded}
            onToggle={() => setColorsExpanded(!colorsExpanded)}
          >
            <TreatmentOptionsList
              type={SystemOptionType.COLOR}
              maxValueLength={50}
            />
          </SectionDisclosure>
        </CardBody>
      </Card>
    </div>
  );
}
