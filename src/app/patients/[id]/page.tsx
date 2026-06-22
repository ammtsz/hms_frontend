"use client";

import { useParams } from "next/navigation";
import React from "react";
import Breadcrumb from "@/components/common/Breadcrumb";
import { getTodayClinic } from "@/utils/timezoneDate";
import {
  LazyHeaderCard,
  LazyCurrentTreatmentCard,
  LazyAttendanceHistoryCard,
  LazyScheduledAttendancesCard,
  LazyPatientNotesCard,
  LazySessionBreakdownCard,
  LazyComponentWrapper,
} from "@/features/patients/detail/LazyComponents";
import { PatientDetailSkeleton } from "@/features/patients/detail/PatientDetailSkeleton";
import { PageError } from "@/components/common/PageError";
import { usePatientWithAttendances } from "@/api/query/hooks/usePatientQueries";
import {
  PatientPageSectionNav,
  PatientPageScrollTargetProvider,
  PATIENT_PAGE_SECTION_IDS,
  PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS,
} from "@/features/patients/detail/PatientPageSectionNav";

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;

  // Use React Query for data fetching and caching
  const {
    data: patient,
    isLoading,
    error,
    refetch,
    isRefetching,
    failureCount,
  } = usePatientWithAttendances(patientId);

  // Loading state with skeleton
  if (isLoading || isRefetching) {
    return (
      <div className="flex flex-col gap-8 bg-gray-50">
        <div className="flex flex-col max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 w-full">
          <Breadcrumb
            items={[
              { label: "Patients", href: "/patients" },
              {
                label: isRefetching ? "Reloading..." : "Loading...",
                isActive: true,
              },
            ]}
          />
          <PatientDetailSkeleton />
          {isRefetching && failureCount > 1 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-center">
                Attempt {failureCount} of 3... Reloading patient data.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    const errorMessage = error.message || "Unknown error";
    const isPatientNotFound = errorMessage.toLowerCase().includes("not found");

    return (
      <div className="flex flex-col gap-8 my-6 sm:my-16">
        <div className="max-w-4xl mx-auto w-full px-4">
          <Breadcrumb
            items={[
              { label: "Patients", href: "/patients" },
              {
                label: isPatientNotFound ? "Not found" : "Error",
                isActive: true,
              },
            ]}
          />
          <PageError
            error={errorMessage}
            reset={!isPatientNotFound ? refetch : undefined}
            title={
              isPatientNotFound
                ? "Patient not found"
                : failureCount > 0
                  ? "Failed after multiple attempts"
                  : "Error loading patient"
            }
            showBackButton={true}
          />
          {!isPatientNotFound && failureCount > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm text-center">
                {failureCount} attempt(s) failed. You can try again.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col gap-8 my-6 sm:my-16">
        <div className="max-w-4xl mx-auto w-full px-4">
          <Breadcrumb
            items={[
              { label: "Patients", href: "/patients" },
              { label: "Not found", isActive: true },
            ]}
          />
          <PageError
            error="Patient not found."
            title="Patient not found"
            backLabel="Back to Patients"
            showBackButton={true}
          />
        </div>
      </div>
    );
  }

  return (
    <PatientPageScrollTargetProvider>
      <div className="min-h-screen bg-gray-50">
        <PatientPageSectionNav />

        <div className="mx-auto max-w-7xl px-3 py-4 pb-24 sm:px-4 sm:py-6 lg:px-6 lg:py-8 lg:pb-8 xl:px-8">
          <Breadcrumb
            items={[
              { label: "Patients", href: "/patients" },
              { label: patient.name, isActive: true },
            ]}
          />

          <section
            id={PATIENT_PAGE_SECTION_IDS.header}
            className={PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS}
            aria-label="Patient info"
          >
            <LazyComponentWrapper>
              <LazyHeaderCard
                patient={patient}
                weeksInTreatment={Math.ceil(
                  (Date.parse(getTodayClinic()) -
                    Date.parse(patient.startDate)) /
                    (1000 * 60 * 60 * 24 * 7),
                )}
              />
            </LazyComponentWrapper>
          </section>

          <section
            id={PATIENT_PAGE_SECTION_IDS.notes}
            className={PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS}
            aria-label="Notes"
          >
            <LazyComponentWrapper>
              <LazyPatientNotesCard
                patientId={patient.id}
                sectionId={PATIENT_PAGE_SECTION_IDS.notes}
              />
            </LazyComponentWrapper>
          </section>

          <div className="space-y-4 sm:space-y-6">
            <section
              id={PATIENT_PAGE_SECTION_IDS.currentTreatment}
              className={PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS}
              aria-label="Current treatment"
            >
              <LazyComponentWrapper>
                <LazyCurrentTreatmentCard
                  patient={patient}
                  sectionId={PATIENT_PAGE_SECTION_IDS.currentTreatment}
                />
              </LazyComponentWrapper>
            </section>

            <section
              id={PATIENT_PAGE_SECTION_IDS.sessionBreakdown}
              className={PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS}
              aria-label="Session breakdown"
            >
              <LazyComponentWrapper>
                <LazySessionBreakdownCard
                  patient={patient}
                  sectionId={PATIENT_PAGE_SECTION_IDS.sessionBreakdown}
                />
              </LazyComponentWrapper>
            </section>

            <section
              id={PATIENT_PAGE_SECTION_IDS.attendanceHistory}
              className={PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS}
              aria-label="Attendance history"
            >
              <LazyComponentWrapper>
                <LazyAttendanceHistoryCard
                  patient={patient}
                  sectionId={PATIENT_PAGE_SECTION_IDS.attendanceHistory}
                />
              </LazyComponentWrapper>
            </section>

            <section
              id={PATIENT_PAGE_SECTION_IDS.scheduledAttendances}
              className={PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS}
              aria-label="Scheduled attendances"
            >
              <LazyComponentWrapper>
                <LazyScheduledAttendancesCard
                  patient={patient}
                  sectionId={PATIENT_PAGE_SECTION_IDS.scheduledAttendances}
                />
              </LazyComponentWrapper>
            </section>
          </div>
        </div>
      </div>
    </PatientPageScrollTargetProvider>
  );
}
