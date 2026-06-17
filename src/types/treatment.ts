/** Treatment session data shapes shared across hooks, forms and components. */

export interface PhysiotherapyLocationTreatment {
  locations: string[];
  color: string;
  duration: number; // in 7-minute units (1 = 7min, 2 = 14min, etc.)
  quantity: number;
  startDate: string; // YYYY-MM-DD format
}

export interface TensLocationTreatment {
  locations: string[];
  quantity: number;
  startDate: string; // YYYY-MM-DD format
}

export interface TreatmentRecommendation {
  physiotherapy?: {
    startDate: string;
    treatments: PhysiotherapyLocationTreatment[];
    notes?: string;
  };
  tens?: {
    startDate: string;
    treatments: TensLocationTreatment[];
    notes?: string;
  };
  returnWeeks: number;
  returnWhenTreatmentComplete: boolean;
}
