export type PostTreatmentFooterStatusVariant = "ready" | "warning";

export interface PostTreatmentFooterStatus {
  variant: PostTreatmentFooterStatusVariant;
  message: string;
}

export const POST_TREATMENT_FOOTER_MESSAGES = {
  ready: "✓ Ready to register",
  selectTreatment: "Select at least one treatment",
  justifyUnperformed: "Please justify all unperformed treatments",
} as const;

export function getPostTreatmentFooterStatus(
  canSubmit: boolean,
  uncheckedWithMissingReason: boolean,
): PostTreatmentFooterStatus {
  if (canSubmit && !uncheckedWithMissingReason) {
    return {
      variant: "ready",
      message: POST_TREATMENT_FOOTER_MESSAGES.ready,
    };
  }
  if (!canSubmit) {
    return {
      variant: "warning",
      message: POST_TREATMENT_FOOTER_MESSAGES.selectTreatment,
    };
  }
  return {
    variant: "warning",
    message: POST_TREATMENT_FOOTER_MESSAGES.justifyUnperformed,
  };
}
