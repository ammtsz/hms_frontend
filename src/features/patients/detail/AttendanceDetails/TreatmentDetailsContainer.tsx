import React from "react";

interface TreatmentDetailsContainerProps {
  children: React.ReactNode;
}

export const TreatmentDetailsContainer: React.FC<
  TreatmentDetailsContainerProps
> = ({ children }) => <div className="mt-3 space-y-2">{children}</div>;
