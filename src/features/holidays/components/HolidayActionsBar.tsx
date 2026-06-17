"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button, Select } from "@/components/ui";

interface HolidayActionsBarProps {
  selectedYear: number;
  years: number[];
  onYearChange: (year: number) => void;
  onCreateClick: () => void;
}

const HolidayActionsBar: React.FC<HolidayActionsBarProps> = ({
  selectedYear,
  years,
  onYearChange,
  onCreateClick,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="year-select"
            className="text-sm font-medium text-gray-700"
          >
            Ano:
          </label>
          <Select
            id="year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="min-h-10 py-1"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            type="button"
            onClick={onCreateClick}
            className="min-h-[44px] w-full bg-blue-800 hover:bg-blue-900 sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Novo Feriado
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HolidayActionsBar;
