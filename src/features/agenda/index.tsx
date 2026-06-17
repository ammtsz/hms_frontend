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
            title="Agenda de Atendimentos"
            description="Visualize e gerencie os agendamentos por data e tipo de atendimento"
            actions={
              <Button
                className="w-full sm:w-auto"
                onClick={() => setShowNewAttendance(true)}
              >
                + Novo Agendamento
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
              title="Consultas de Avaliação"
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
              title="Fisioterapia / TENS"
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
              message="Carregando formulário de agendamento..."
              size="small"
            />
          }
        >
          <NewAttendanceFormModal
            onClose={() => setShowNewAttendance(false)}
            onSuccess={handleFormSuccess}
            title="Agendamento de Consulta de Avaliação"
            subtitle="Atendimentos do tipo Fisioterapia e TENS devem ser criados
          automaticamente após a consulta de avaliação."
            showDateField={true}
            validationDate={selectedDate || getTodayClinic()}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AgendaCalendar;
