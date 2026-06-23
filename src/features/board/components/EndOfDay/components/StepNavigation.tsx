import React from "react";

interface StepNavigationProps {
  currentStep: "incomplete" | "absences" | "confirm";
  incompleteAppointmentsCount: number;
  scheduledAbsencesCount: number;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  incompleteAppointmentsCount,
  scheduledAbsencesCount,
}) => {
  const getStepStatus = (step: "incomplete" | "absences" | "confirm") => {
    switch (step) {
      case "incomplete":
        if (incompleteAppointmentsCount === 0) return "completed";
        return currentStep === step ? "current" : "pending";
      case "absences":
        if (currentStep === "confirm") return "completed";
        if (scheduledAbsencesCount === 0) return "completed";
        return currentStep === step ? "current" : "pending";
      case "confirm":
        return currentStep === "confirm" ? "current" : "pending";
      default:
        return "pending";
    }
  };

  const getStepClass = (status: string) => {
    switch (status) {
      case "current":
        return "bg-blue-500 text-white";
      case "completed":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-300 text-gray-600";
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${getStepClass(
            getStepStatus("incomplete"),
          )}`}
        >
          1
        </div>
        <div className="ml-3 min-w-0 text-sm font-medium text-gray-700">
          Appointments
        </div>
      </div>
      <div className="flex flex-1 items-center min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${getStepClass(
            getStepStatus("absences"),
          )}`}
        >
          2
        </div>
        <div className="ml-3 min-w-0 text-sm font-medium text-gray-700">
          Absences
        </div>
      </div>
      <div className="flex flex-1 items-center min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${getStepClass(
            getStepStatus("confirm"),
          )}`}
        >
          3
        </div>
        <div className="ml-3 min-w-0 text-sm font-medium text-gray-700">
          Confirmation
        </div>
      </div>
    </div>
  );
};

export default StepNavigation;
