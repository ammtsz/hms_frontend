// Treatment Form components
export { default as PostAttendanceModal } from './PostAttendanceModal';
export { default as TreatmentRecommendationsSection } from './components/tabs/TreatmentRecommendationsTab/TreatmentRecommendationsSection';

// Treatment Form hooks
export { usePostAttendanceForm } from './hooks/usePostAttendanceForm';

// Treatment Form types
export type { PostConsultationFormData, PatientStatusValue } from './hooks/usePostAttendanceForm';
export type { TreatmentRecommendation, PhysiotherapyLocationTreatment, TensLocationTreatment } from './types';
