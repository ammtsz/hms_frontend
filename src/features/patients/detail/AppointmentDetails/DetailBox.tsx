import React from "react";

interface DetailBoxProps {
  children: React.ReactNode;
  variant?:
    | "physiotherapy"
    | "tens"
    | "assessment"
    | "notes"
    | "info"
    | "disabled";
  className?: string;
}

export const DetailBox: React.FC<DetailBoxProps> = ({
  children,
  variant = "info",
  className = "",
}) => {
  const variantClasses = {
    physiotherapy: "bg-white border-l-4 border-l-yellow-500 border-gray-200",
    tens: "bg-white border-l-4 border-l-blue-500 border-gray-200",
    assessment: "bg-white border-l-4 border-l-purple-500 border-gray-200",
    notes: "bg-white border-gray-200",
    info: "bg-gray-50 border-gray-200",
    disabled:
      "bg-gray-50 border-l-4 border-l-gray-400 border-gray-200 opacity-80",
  };

  return (
    <div
      className={`p-3 rounded border ${variantClasses[variant]} ${className} p-4`}
    >
      {children}
    </div>
  );
};
