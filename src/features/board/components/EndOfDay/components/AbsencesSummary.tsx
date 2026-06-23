import React from "react";
import { AlertTriangle } from "lucide-react";

interface AbsencesSummaryProps {
  count: number;
}

export const AbsencesSummary: React.FC<AbsencesSummaryProps> = ({ count }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Absences</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              There {count === 1 ? "is" : "are"} {count} patient(s) who missed
              scheduled appointments. Please justify absences to complete the
              day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
