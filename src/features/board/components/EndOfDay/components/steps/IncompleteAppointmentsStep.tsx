import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { IAppointmentStatusDetailWithType } from "../../../../utils/appointmentDataUtils";
import {
  getAppointmentTypeLabel,
  getAppointmentStatusLabel,
} from "@/utils/apiTransformers";
import { formatDisplayDate } from "@/utils/dateUtils";
import { Button } from "@/components/ui";

interface IncompleteAppointmentsStepProps {
  incompleteAppointments: IAppointmentStatusDetailWithType[];
  selectedDate: string;
  onNext: () => void;
  onCancel: () => void;
}

const IncompleteAppointmentsStep: React.FC<IncompleteAppointmentsStepProps> = ({
  incompleteAppointments,
  selectedDate,
  onNext,
  onCancel,
}) => {
  return (
    <div className="flex flex-col justify-between min-h-[400px]">
      <h3 className="text-lg font-semibold mb-4">
        Incomplete Appointments - {formatDisplayDate(selectedDate)}
      </h3>

      {incompleteAppointments.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                All appointments were completed!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>There are no incomplete appointments for this day.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Incomplete appointments
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {`There ${incompleteAppointments.length === 1 ? "is" : "are"} ${incompleteAppointments.length} appointment${incompleteAppointments.length === 1 ? "" : "s"} that
                    ${incompleteAppointments.length === 1 ? "was" : "were"} not completed. Go back to the appointments page and
                    drag all patients to the "Scheduled" or
                    "Completed" columns before finalizing the day.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {incompleteAppointments.map((appointment) => (
            <div
              key={`${appointment.appointmentId}-${appointment.appointmentType}`}
              className="border border-gray-200 rounded-md p-4 bg-white"
            >
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {appointment.name}
                </h4>
                <p className="text-sm text-red-500 font-medium">
                  Status:{" "}
                  {getAppointmentStatusLabel(
                    appointment.checkedInTime,
                    appointment.onGoingTime,
                    appointment.completedTime,
                  )}
                </p>
                <p className="text-sm text-gray-600 font-normal">
                  {getAppointmentTypeLabel(appointment.appointmentType)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 mt-6 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={incompleteAppointments.length > 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default IncompleteAppointmentsStep;
