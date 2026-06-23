import React from "react";
import { AppointmentType } from "@/types/types";

interface AppointmentTypeTagProps {
  type: AppointmentType;
  size?: "sm" | "md";
  count: number;
}

const AppointmentTypeTag: React.FC<AppointmentTypeTagProps> = ({
  type,
  size = "sm",
  count,
}) => {
  const getTypeConfig = (appointmentType: AppointmentType) => {
    switch (appointmentType) {
      case "tens":
        return {
          label: "TENS",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
        };
      case "physiotherapy":
        return {
          label: "Physiotherapy",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
        };
      case "assessment":
        return {
          label: "Assessment Consultation",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
        };
      default:
        return {
          label: "Unknown",
          bgColor: "bg-gray-100",
          textColor: "text-gray-500",
          borderColor: "border-gray-200",
        };
    }
  };

  const config = getTypeConfig(type);
  const sizeClasses =
    size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium text-center text-nowrap
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses}
      `}
      title={config.label + " " + (count > 1 ? `(${count} locations)` : "")}
    >
      {count}
    </span>
  );
};

export default AppointmentTypeTag;
