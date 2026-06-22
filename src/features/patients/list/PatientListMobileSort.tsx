"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Field, Select, Button } from "@/components/ui";
import type { PatientBasic } from "@/types/types";

const SORT_OPTIONS: { value: keyof PatientBasic; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "phone", label: "Phone" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
];

export interface PatientListMobileSortProps {
  sortBy: keyof PatientBasic | null;
  sortAsc: boolean;
  handleSort: (key: keyof PatientBasic) => void;
}

export function PatientListMobileSort({
  sortBy,
  sortAsc,
  handleSort,
}: PatientListMobileSortProps) {
  return (
    <div
      className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      data-testid="patient-list-mobile-sort"
    >
      <Field label="Sort by" htmlFor="patient-list-sort" className="flex-1">
        <Select
          id="patient-list-sort"
          value={sortBy ?? ""}
          onChange={(event) => {
            const value = event.target.value as keyof PatientBasic | "";
            if (value) {
              handleSort(value);
            }
          }}
        >
          <option value="" disabled>
            Select…
          </option>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      {sortBy ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] shrink-0"
          onClick={() => handleSort(sortBy)}
          aria-label={
            sortAsc ? "Ascending order; toggle" : "Descending order; toggle"
          }
        >
          {sortAsc ? (
            <ChevronUp className="h-5 w-5" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden />
          )}
        </Button>
      ) : null}
    </div>
  );
}
