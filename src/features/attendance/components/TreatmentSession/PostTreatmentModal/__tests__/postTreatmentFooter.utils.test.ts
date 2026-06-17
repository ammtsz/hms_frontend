import { getPostTreatmentFooterStatus } from "../postTreatmentFooter.utils";

describe("getPostTreatmentFooterStatus", () => {
  it("returns ready when can submit and all unchecked rows have reasons", () => {
    expect(getPostTreatmentFooterStatus(true, false)).toEqual({
      variant: "ready",
      message: "✓ Pronto para registrar",
    });
  });

  it("returns mark treatment when nothing is marked as completed", () => {
    expect(getPostTreatmentFooterStatus(false, true)).toEqual({
      variant: "warning",
      message: "Marque ao menos um tratamento",
    });
  });

  it("returns cancellation reason message when unchecked row lacks reason", () => {
    expect(getPostTreatmentFooterStatus(true, true)).toEqual({
      variant: "warning",
      message: "Justifique todos os tratamentos não realizados",
    });
  });
});
