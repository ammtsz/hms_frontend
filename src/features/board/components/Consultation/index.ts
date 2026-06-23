// Treatment Form components
export { default as PostConsultationModal } from './PostConsultationModal';
export { default as TreatmentRecommendationsSection } from './components/tabs/TreatmentRecommendationsTab/TreatmentRecommendationsSection';

// Treatment Form hooks
export { usePostConsultationForm } from './hooks/usePostConsultationForm';

// Treatment Form types
export type { PostConsultationFormData, PatientStatusValue } from './hooks/usePostConsultationForm';
export type { TreatmentRecommendation, PhysiotherapyLocationTreatment, TensLocationTreatment } from './types';
