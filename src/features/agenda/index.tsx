"use client";

import React, { lazy, Suspense } from "react";
import ManageAttendanceModal from "@/features/attendance/components/AttendanceActions/ManageAttendanceModal";
import AgendaColumn from "./components/AgendaColumn";
import AgendaCalendarFilters from "./components/AgendaCalendarFilters";
import UpcomingHolidaysWidget from "./components/UpcomingHolidaysWidget";
import { useAgendaCalendar } from "./hooks/useAgendaCalendar";
import LoadingFallback from "@/components/common/LoadingFallback";
import { getTodayClinic } from "@/utils/timezoneDate";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  AGENDA_COLUMN_TITLES,
  AGENDA_PAGE_LABELS,
} from "./utils/agendaFilterConstants";

// Lazy load heavy modal component for better bundle optimization
const NewAttendanceFormModal = lazy(
  () => import("@/features/agenda/components/NewAttendanceFormModal"),
);

const AgendaCalendar: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    agendaDayWindowDays,
    setAgendaDayWindowDays,
    agendaStatusFilters,
    setAgendaStatusFilters,
    patientFilter,
    setPatientFilter,
    filteredAgenda,
    openAssessmentIdx,
    setOpenAssessmentIdx,
    openPhysiotherapyIdx,
    setOpenPhysiotherapyIdx,
    showNewAttendance,
    setShowNewAttendance,
    handleFormSuccess,
    loading,
    refreshAgenda,
    isRefreshing,
    rangeSummaryText,
  } = useAgendaCalendar();

  return (
    <div className="flex flex-col gap-8 my-6 sm:my-16">
      <UpcomingHolidaysWidget />

      {/* Agenda Calendar Management */}
      <Card>
        <CardHeader className="border-gray-100 p-4">
          <PageHeader
            title={AGENDA_PAGE_LABELS.title}
            description={AGENDA_PAGE_LABELS.description}
            actions={
              <Button
                className="w-full sm:w-auto"
                onClick={() => setShowNewAttendance(true)}
              >
                {AGENDA_PAGE_LABELS.newAttendanceButton}
              </Button>
            }
          />
        </CardHeader>
        <CardBody className="p-4">
          <AgendaCalendarFilters
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            agendaDayWindowDays={agendaDayWindowDays}
            setAgendaDayWindowDays={setAgendaDayWindowDays}
            agendaStatusFilters={agendaStatusFilters}
            setAgendaStatusFilters={setAgendaStatusFilters}
            patientFilter={patientFilter}
            setPatientFilter={setPatientFilter}
            refreshAgenda={refreshAgenda}
            isRefreshing={isRefreshing}
            rangeSummaryText={rangeSummaryText}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgendaColumn
              title={AGENDA_COLUMN_TITLES.assessment}
              agendaItems={filteredAgenda.assessment.map((item) => ({
                ...item,
                patients: item.patients.map((patient) => ({
                  ...patient,
                  attendanceType: patient.attendanceType ?? "assessment",
                })),
              }))}
              openAgendaIdx={openAssessmentIdx}
              setOpenAgendaIdx={setOpenAssessmentIdx}
              columnType="assessment"
              isLoading={loading}
              isRefreshing={isRefreshing}
            />

            <AgendaColumn
              title={AGENDA_COLUMN_TITLES.physiotherapy}
              agendaItems={filteredAgenda.physiotherapy.map((item) => ({
                ...item,
                patients: item.patients.map((patient) => ({
                  ...patient,
                  attendanceType: patient.attendanceType ?? "physiotherapy",
                })),
              }))}
              openAgendaIdx={openPhysiotherapyIdx}
              setOpenAgendaIdx={setOpenPhysiotherapyIdx}
              columnType="physiotherapy"
              isLoading={loading}
              isRefreshing={isRefreshing}
            />
          </div>
        </CardBody>
      </Card>

      <ManageAttendanceModal onRefresh={refreshAgenda} />
      {showNewAttendance && (
        <Suspense
          fallback={
            <LoadingFallback
              message={AGENDA_PAGE_LABELS.schedulingFormLoading}
              size="small"
            />
          }
        >
          <NewAttendanceFormModal
            onClose={() => setShowNewAttendance(false)}
            onSuccess={handleFormSuccess}
            title={AGENDA_PAGE_LABELS.schedulingModalTitle}
            subtitle="Physiotherapy and TENS appointments must be created automatically after the assessment consultation."
            showDateField={true}
            validationDate={selectedDate || getTodayClinic()}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AgendaCalendar;
