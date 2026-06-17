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

const MIN_THRESHOLD = 1;
const MAX_THRESHOLD = 10;
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
        showToast("Configuração atualizada com sucesso.", "success");
      },
      onError: (err) => {
        showToast(
          err instanceof Error ? err.message : "Erro ao salvar",
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
            ⚙️ Configurações de Sistema
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie as opções do sistema
          </p>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Limite de faltas Section */}
          <SectionDisclosure
            title="Limite de faltas"
            isOpen={thresholdExpanded}
            onToggle={() => setThresholdExpanded(!thresholdExpanded)}
            bodyClassName="space-y-3"
          >
            <p className="text-sm text-gray-600">
              Defina quantas faltas consecutivas sem justificativa levam o
              paciente ao status F (Faltas consecutivas).
            </p>
            {thresholdLoading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="appointments-threshold" className="sr-only">
                    Limite de faltas (1 a 10)
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
                    loadingText="Salvando..."
                    className="w-full sm:w-auto"
                  >
                    Salvar
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  O valor atual é {serverValue}. Quando o paciente atinge este
                  número de faltas consecutivas sem justificativa, o sistema
                  altera o status para F (Faltas consecutivas) e cancela os
                  atendimentos futuros.
                </p>
                {!isAdmin && (
                  <p className="text-sm text-amber-700">
                    Apenas administradores podem alterar este valor.
                  </p>
                )}
                {localValue !== "" && !thresholdValid && (
                  <p className="text-sm text-red-600" role="alert">
                    Informe um valor entre {MIN_THRESHOLD} e {MAX_THRESHOLD}.
                  </p>
                )}
              </>
            )}
          </SectionDisclosure>

          {/* Priorities Section */}
          <SectionDisclosure
            title="Prioridades"
            isOpen={prioritiesExpanded}
            onToggle={() => setPrioritiesExpanded(!prioritiesExpanded)}
          >
            <PriorityManagementList />
          </SectionDisclosure>

          {/* Note Categories Section */}
          <SectionDisclosure
            title="Categorias das Anotações"
            isOpen={noteCategoriesExpanded}
            onToggle={() => setNoteCategoriesExpanded(!noteCategoriesExpanded)}
          >
            <NoteCategoriesManagementList />
          </SectionDisclosure>

          {/* Body Locations Section */}
          <SectionDisclosure
            title="Locais do Corpo"
            isOpen={bodyLocationsExpanded}
            onToggle={() => setBodyLocationsExpanded(!bodyLocationsExpanded)}
          >
            <TreatmentOptionsList type={SystemOptionType.BODY_LOCATION} />
          </SectionDisclosure>

          {/* Colors Section */}
          <SectionDisclosure
            title="Cores (Fisioterapia)"
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
