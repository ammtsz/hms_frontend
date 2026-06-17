export type PostTreatmentFooterStatusVariant = "ready" | "warning";

export interface PostTreatmentFooterStatus {
  variant: PostTreatmentFooterStatusVariant;
  message: string;
}

export function getPostTreatmentFooterStatus(
  canSubmit: boolean,
  uncheckedWithMissingReason: boolean,
): PostTreatmentFooterStatus {
  if (canSubmit && !uncheckedWithMissingReason) {
    return { variant: "ready", message: "✓ Pronto para registrar" };
  }
  if (!canSubmit) {
    return {
      variant: "warning",
      message: "Marque ao menos um tratamento",
    };
  }
  return {
    variant: "warning",
    message: "Justifique todos os tratamentos não realizados",
  };
}
