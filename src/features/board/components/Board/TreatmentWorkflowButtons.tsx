import { useOpenEndOfDay } from "@/stores/modalStore";
import React from "react";
import { Button } from "@/components/ui";

interface TreatmentWorkflowButtonsProps {
  isDayFinalized?: boolean;
  noSlotsForDay?: boolean;
  selectedDate: string;
}

export const TreatmentWorkflowButtons: React.FC<
  TreatmentWorkflowButtonsProps
> = ({ isDayFinalized = false, noSlotsForDay = false, selectedDate }) => {
  const openEndOfDayModal = useOpenEndOfDay();
  const disabled = isDayFinalized || noSlotsForDay;

  return (
    <div className="mt-6 flex gap-4 justify-center">
      <Button
        type="button"
        className="w-full"
        onClick={() => openEndOfDayModal({ selectedDate })}
        disabled={disabled}
      >
        {isDayFinalized
          ? "Day finalized"
          : noSlotsForDay
            ? "No appointments on this day"
            : "End of Day"}
      </Button>
    </div>
  );
};
