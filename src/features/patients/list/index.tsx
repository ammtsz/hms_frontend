"use client";

import React from "react";
import { usePatientList } from "./hooks/usePatientList";
import Link from "next/link";
import { Input, Card, CardBody, CardHeader, Button } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { PatientListCard } from "./PatientListCard";
import { PatientListTable } from "./PatientListTable";
import { PatientListMobileSort } from "./PatientListMobileSort";

const PatientList: React.FC = () => {
  const {
    search,
    setSearch,
    sortBy,
    sortAsc,
    loaderRef,
    filtered,
    handleSort,
    paginated,
    statusLegend,
    priorityLegend,
    loading,
    error,
    refreshPatients,
    hasNoPatients,
  } = usePatientList();

  if (loading) {
    return (
      <Card>
        <CardHeader className="border-gray-100 p-4">
          <h2 className="text-xl font-semibold text-gray-800">Pacientes</h2>
          <p className="mt-1 text-sm text-gray-600">
            Carregando lista de pacientes...
          </p>
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 h-7 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </CardHeader>
        <CardBody className="p-4">
          <p className="mb-4 text-sm text-gray-600">Carregando pacientes...</p>
          <div className="mb-4 h-10 w-full animate-pulse rounded bg-gray-100" />
          <div className="space-y-3 md:hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
              />
            ))}
          </div>
          <div className="hidden space-y-2 md:block">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-gray-100 p-3">
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="border-gray-100 p-4">
          <h2 className="text-xl font-semibold text-gray-800">Pacientes</h2>
          <p className="mt-1 text-sm text-gray-600">
            Erro ao carregar lista de pacientes
          </p>
        </CardHeader>
        <CardBody className="p-8 text-center">
          <div className="mb-4 text-red-600">{error}</div>
          <Button onClick={() => refreshPatients()}>Tentar novamente</Button>
        </CardBody>
      </Card>
    );
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center text-gray-600">
      Nenhum paciente cadastrado
      <Link
        href="/patients/new"
        className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
      >
        Cadastrar Paciente
      </Link>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="border-gray-100 p-4">
          <PageHeader
            title={
              <>
                Pacientes{" "}
                <span className="text-sm text-gray-600">
                  ({filtered.length})
                </span>
              </>
            }
            description="Gerencie e visualize todos os pacientes cadastrados"
            actions={
              <Link
                href="/patients/new"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 sm:w-auto"
              >
                + Novo Paciente
              </Link>
            }
          />
        </CardHeader>

        <CardBody className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="md:hidden">
            <PatientListMobileSort
              sortBy={sortBy}
              sortAsc={sortAsc}
              handleSort={handleSort}
            />
            <div className="space-y-3" data-testid="patient-list-cards">
              {hasNoPatients
                ? emptyState
                : paginated.map((patient) => (
                    <PatientListCard
                      key={patient.id}
                      patient={patient}
                      statusLegend={statusLegend}
                      priorityLegend={priorityLegend}
                    />
                  ))}
            </div>
          </div>

          <div className="hidden md:block">
            <PatientListTable
              paginated={paginated}
              hasNoPatients={hasNoPatients}
              sortBy={sortBy}
              sortAsc={sortAsc}
              handleSort={handleSort}
              statusLegend={statusLegend}
              priorityLegend={priorityLegend}
            />
          </div>

          <div ref={loaderRef} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardBody className="p-4">
            <h3 className="mb-3 font-semibold text-gray-800">
              Legenda de Status:
            </h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                <span className="font-bold">N</span>: Paciente Novo
              </span>
              <span>
                <span className="font-bold">T</span>: Em Tratamento
              </span>
              <span>
                <span className="font-bold">A</span>: Alta do tratamento
              </span>
              <span>
                <span className="font-bold">F</span>: Faltas Consecutivas
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <h3 className="mb-3 font-semibold text-gray-800">
              Legenda de Prioridade:
            </h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {Object.entries(priorityLegend)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([code, label]) => (
                  <span key={code}>
                    <span className="font-bold">{code}</span>: {label}
                  </span>
                ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default PatientList;
