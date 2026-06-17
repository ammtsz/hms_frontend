import React from "react";
import { CheckCircle } from "lucide-react";

export const EmptyAbsencesState: React.FC = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-auto">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Todas as presenças confirmadas!
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p>Não há faltas agendadas para justificar.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
