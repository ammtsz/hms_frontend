/** Treatment session data shapes shared across hooks, forms and components. */

export interface LocationTreatment {
  locations: string[];
  quantity: number;
  startDate: string; // YYYY-MM-DD format
  duration: number; // minutes: 30 | 45 | 60
}

/** @deprecated Use LocationTreatment — kept as alias for gradual migration */
export type PhysiotherapyLocationTreatment = LocationTreatment;

/** @deprecated Use LocationTreatment — kept as alias for gradual migration */
export type TensLocationTreatment = LocationTreatment;

export interface TreatmentRecommendation {
  physiotherapy?: {
    startDate: string;
    treatments: LocationTreatment[];
    notes?: string;
  };
  tens?: {
    startDate: string;
    treatments: LocationTreatment[];
    notes?: string;
  };
  returnWeeks: number;
  returnWhenTreatmentComplete: boolean;
}
