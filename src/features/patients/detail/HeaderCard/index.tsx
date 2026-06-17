import React from "react";
import { Patient } from "@/types/types";
import QuickActions from "./QuickActions";
import { PriorityBadge } from "@/features/patients/detail/HeaderCard/PriorityBadge";
import { TreatmentStatusBadge } from "@/features/patients/detail/HeaderCard/TreatmentStatusBadge";
import { Card, CardBody } from "@/components/ui";

interface HeaderCardProps {
  patient: Patient;
  weeksInTreatment?: number;
}

function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatStreakMessage(streak: number): string {
  return streak === 1
    ? "1 falta consecutiva não justificada"
    : `${streak} faltas consecutivas não justificadas`;
}

export const HeaderCard: React.FC<HeaderCardProps> = ({
  patient,
  weeksInTreatment,
}) => {
  const streak = patient.missingAppointmentsStreak ?? 0;
  const showActiveStreakAlert = patient.status === "T" && streak > 0;
  const showHistoricalStreak = patient.status === "F" && streak > 0;

  const metadataItems: React.ReactNode[] = [
    <span key="id" className="text-gray-500">
      #{patient.id}
    </span>,
    <span key="age">{calculateAge(patient.birthDate)} anos</span>,
  ];

  if (patient.phone) {
    const phoneDigits = patient.phone.replace(/\D/g, "");
    metadataItems.push(
      <a
        key="phone"
        href={`tel:${phoneDigits}`}
        className="break-all hover:text-gray-900"
      >
        {patient.phone}
      </a>,
    );
  }

  if (weeksInTreatment !== undefined) {
    metadataItems.push(
      <span key="weeks">{weeksInTreatment} sem. em tratamento</span>,
    );
  }

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
                {patient.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <TreatmentStatusBadge status={patient.status} />
                <PriorityBadge priority={patient.priority} />
              </div>
            </div>
            <QuickActions patient={patient} />
          </div>

          <p className="text-sm text-gray-600">
            {metadataItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 ? (
                  <span className="mx-1.5 text-gray-400" aria-hidden>
                    ·
                  </span>
                ) : null}
                {item}
              </React.Fragment>
            ))}
          </p>

          {showActiveStreakAlert ? (
            <div
              role="status"
              aria-label={formatStreakMessage(streak)}
              className="text-sm text-rose-700 font-semibold"
            >
              {formatStreakMessage(streak)}
            </div>
          ) : null}

          {showHistoricalStreak ? (
            <p className="text-sm text-gray-400">
              {formatStreakMessage(streak)} (tratamento anterior)
            </p>
          ) : null}

          <div className="min-w-0">
            <p className="text-sm text-gray-500">Queixa principal</p>
            <p className="mt-1 break-words text-base text-gray-900">
              {patient.mainComplaint}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
