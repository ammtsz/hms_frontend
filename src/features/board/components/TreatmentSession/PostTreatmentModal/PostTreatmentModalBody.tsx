import React from "react";
import { TreatmentTypeSection } from "./TreatmentTypeSection";
import { GeneralNotesField } from "./GeneralNotesField";
import type { PostTreatmentRow } from "./types";
import { Button } from "@/components/ui";

interface PostTreatmentModalBodyProps {
  loading: boolean;
  error: Error | unknown | null | undefined;
  rows: PostTreatmentRow[];
  rowsByType: { physiotherapy: PostTreatmentRow[]; tens: PostTreatmentRow[] };
  completedAppointmentIds: Set<number>;
  cancellationReasons: Map<number, string>;
  generalNotes: string;
  setGeneralNotes: (value: string) => void;
  isSubmitting: boolean;
  onToggle: (appointmentId: number) => void;
  onCancellationReasonChange: (appointmentId: number, value: string) => void;
  onRetry: () => void | Promise<void>;
}

export const PostTreatmentModalBody: React.FC<PostTreatmentModalBodyProps> = ({
  loading,
  error,
  rows,
  rowsByType,
  completedAppointmentIds,
  cancellationReasons,
  generalNotes,
  setGeneralNotes,
  isSubmitting,
  onToggle,
  onCancellationReasonChange,
  onRetry,
}) => (
  <div className="p-4 overflow-y-auto flex-1 min-h-0">
    {loading ? (
      <div className="flex justify-center py-8 text-gray-500">Loading...</div>
    ) : error ? (
      <div className="py-8 text-red-600 text-center space-y-3">
        <p>
          Error loading:{" "}
          {typeof error === "object" && error !== null && "message" in error
            ? String((error as Error).message)
            : String(error)}
        </p>
        <Button type="button" onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      </div>
    ) : rows.length === 0 ? (
      <div className="py-8 text-gray-500 text-center space-y-3">
        <p>No treatments found for these appointments.</p>
        <Button type="button" onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      </div>
    ) : (
      <>
        <p className="text-sm text-gray-600 mb-3">
          Treatments completed. If any have not been completed, uncheck them and
          provide a reason (these will have their status changed to
          &quot;cancelled&quot;).
        </p>
        <div className="space-y-4">
          {(["physiotherapy", "tens"] as const).map((treatmentType) => {
            const typeRows = rowsByType[treatmentType];
            if (typeRows.length === 0) return null;

            return (
              <TreatmentTypeSection
                key={treatmentType}
                treatmentType={treatmentType}
                rows={typeRows}
                completedAppointmentIds={completedAppointmentIds}
                cancellationReasons={cancellationReasons}
                isSubmitting={isSubmitting}
                onToggle={onToggle}
                onCancellationReasonChange={onCancellationReasonChange}
              />
            );
          })}
        </div>
        <GeneralNotesField value={generalNotes} onChange={setGeneralNotes} />
      </>
    )}
  </div>
);
