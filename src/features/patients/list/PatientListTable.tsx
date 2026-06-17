"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronUp, ChevronDown, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { PatientBasic } from "@/types/types";

export interface PatientListTableProps {
  paginated: PatientBasic[];
  hasNoPatients: boolean;
  sortBy: keyof PatientBasic | null;
  sortAsc: boolean;
  handleSort: (key: keyof PatientBasic) => void;
  statusLegend: Record<string, string>;
  priorityLegend: Record<string, string>;
}

function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortAsc,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  columnKey: keyof PatientBasic;
  sortBy: keyof PatientBasic | null;
  sortAsc: boolean;
  onSort: (key: keyof PatientBasic) => void;
  align?: "left" | "center";
  className?: string;
}) {
  const isActive = sortBy === columnKey;
  const icon = isActive ? (
    sortAsc ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    )
  ) : (
    <Filter size={16} className="text-gray-400" />
  );

  return (
    <TableHead
      align={align}
      className={`cursor-pointer ${className ?? ""}`}
      onClick={() => onSort(columnKey)}
    >
      <div
        className={`flex items-center gap-1 ${align === "center" ? "justify-center" : ""}`}
      >
        {label}
        {icon}
      </div>
    </TableHead>
  );
}

export function PatientListTable({
  paginated,
  hasNoPatients,
  sortBy,
  sortAsc,
  handleSort,
  statusLegend,
  priorityLegend,
}: PatientListTableProps) {
  const router = useRouter();

  return (
    <TableContainer data-testid="patient-list-table">
      <Table className="text-primary-dark">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <SortableHeader
              label="Registro"
              columnKey="id"
              sortBy={sortBy}
              sortAsc={sortAsc}
              onSort={handleSort}
              align="center"
              className="hidden sm:table-cell"
            />
            <SortableHeader
              label="Nome"
              columnKey="name"
              sortBy={sortBy}
              sortAsc={sortAsc}
              onSort={handleSort}
            />
            <SortableHeader
              label="Telefone"
              columnKey="phone"
              sortBy={sortBy}
              sortAsc={sortAsc}
              onSort={handleSort}
              align="center"
            />
            <SortableHeader
              label="Prioridade"
              columnKey="priority"
              sortBy={sortBy}
              sortAsc={sortAsc}
              onSort={handleSort}
              align="center"
            />
            <SortableHeader
              label="Status"
              columnKey="status"
              sortBy={sortBy}
              sortAsc={sortAsc}
              onSort={handleSort}
              align="center"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasNoPatients ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <div className="my-8 flex flex-col items-center justify-center gap-4">
                  Nenhum paciente cadastrado
                  <Link
                    href="/patients/new"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    Cadastrar Paciente
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                onClick={() => router.push(`/patients/${p.id}`)}
              >
                <TableCell align="center" className="hidden sm:table-cell">
                  {p.id}
                </TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell align="center">{p.phone}</TableCell>
                <TableCell align="center">
                  <span className="group relative">
                    {p.priority}
                    <span className="legend-tag">
                      {priorityLegend[p.priority] ?? p.priority}
                    </span>
                  </span>
                </TableCell>
                <TableCell align="center">
                  <span className="group relative">
                    {p.status}
                    <span className="legend-tag">
                      {statusLegend[p.status]}
                    </span>
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
