"use client";

import React, { lazy, Suspense } from "react";
import ManageAttendanceModal from "@/features/attendance/components/AttendanceActions/ManageAttendanceModal";
import ScheduleColumn from "./components/ScheduleColumn";
import ScheduleCalendarFilters from "./components/ScheduleCalendarFilters";
import UpcomingHolidaysWidget from "./components/UpcomingHolidaysWidget";
import { useScheduleCalendar } from "./hooks/useScheduleCalendar";
import LoadingFallback from "@/components/common/LoadingFallback";
import { getTodayClinic } from "@/utils/timezoneDate";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  SCHEDULE_COLUMN_TITLES,
  SCHEDULE_PAGE_LABELS,
} from "./utils/scheduleFilterConstants";

// Lazy load heavy modal component for better bundle optimization
const NewAttendanceFormModal = lazy(
  () => import("@/features/schedule/components/NewAttendanceFormModal"),
);

const ScheduleCalendar: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    scheduleDayWindowDays,
    setScheduleDayWindowDays,
    scheduleStatusFilters,
    setScheduleStatusFilters,
    patientFilter,
    setPatientFilter,
    filteredSchedule,
    openAssessmentIdx,
    setOpenAssessmentIdx,
    openPhysiotherapyIdx,
    setOpenPhysiotherapyIdx,
    showNewAttendance,
    setShowNewAttendance,
    handleFormSuccess,
    loading,
    refreshSchedule,
    isRefreshing,
    rangeSummaryText,
  } = useScheduleCalendar();

  return (
    <div className="flex flex-col gap-8 my-6 sm:my-16">
      <UpcomingHolidaysWidget />

      {/* Schedule Calendar Management */}
      <Card>
        <CardHeader className="border-gray-100 p-4">
          <PageHeader
            title={SCHEDULE_PAGE_LABELS.title}
            description={SCHEDULE_PAGE_LABELS.description}
            actions={
              <Button
                className="w-full sm:w-auto"
                onClick={() => setShowNewAttendance(true)}
              >
                {SCHEDULE_PAGE_LABELS.newAttendanceButton}
              </Button>
            }
          />
        </CardHeader>
        <CardBody className="p-4">
          <ScheduleCalendarFilters
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            scheduleDayWindowDays={scheduleDayWindowDays}
            setScheduleDayWindowDays={setScheduleDayWindowDays}
            scheduleStatusFilters={scheduleStatusFilters}
            setScheduleStatusFilters={setScheduleStatusFilters}
            patientFilter={patientFilter}
            setPatientFilter={setPatientFilter}
            refreshSchedule={refreshSchedule}
            isRefreshing={isRefreshing}
            rangeSummaryText={rangeSummaryText}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScheduleColumn
              title={SCHEDULE_COLUMN_TITLES.assessment}
              scheduleItems={filteredSchedule.assessment.map((item) => ({
                ...item,
                patients: item.patients.map((patient) => ({
                  ...patient,
                  attendanceType: patient.attendanceType ?? "assessment",
                })),
              }))}
              openScheduleIdx={openAssessmentIdx}
              setOpenScheduleIdx={setOpenAssessmentIdx}
              columnType="assessment"
              isLoading={loading}
              isRefreshing={isRefreshing}
            />

            <ScheduleColumn
              title={SCHEDULE_COLUMN_TITLES.physiotherapy}
              scheduleItems={filteredSchedule.physiotherapy.map((item) => ({
                ...item,
                patients: item.patients.map((patient) => ({
                  ...patient,
                  attendanceType: patient.attendanceType ?? "physiotherapy",
                })),
              }))}
              openScheduleIdx={openPhysiotherapyIdx}
              setOpenScheduleIdx={setOpenPhysiotherapyIdx}
              columnType="physiotherapy"
              isLoading={loading}
              isRefreshing={isRefreshing}
            />
          </div>
        </CardBody>
      </Card>

      <ManageAttendanceModal onRefresh={refreshSchedule} />
      {showNewAttendance && (
        <Suspense
          fallback={
            <LoadingFallback
              message={SCHEDULE_PAGE_LABELS.schedulingFormLoading}
              size="small"
            />
          }
        >
          <NewAttendanceFormModal
            onClose={() => setShowNewAttendance(false)}
            onSuccess={handleFormSuccess}
            title={SCHEDULE_PAGE_LABELS.schedulingModalTitle}
            subtitle="Physiotherapy and TENS appointments must be created automatically after the assessment consultation."
            showDateField={true}
            validationDate={selectedDate || getTodayClinic()}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ScheduleCalendar;
