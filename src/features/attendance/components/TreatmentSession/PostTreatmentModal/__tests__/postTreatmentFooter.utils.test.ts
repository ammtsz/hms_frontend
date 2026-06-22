import {
  getPostTreatmentFooterStatus,
  POST_TREATMENT_FOOTER_MESSAGES,
} from "../postTreatmentFooter.utils";

describe("getPostTreatmentFooterStatus", () => {
  it("returns ready when can submit and all unchecked rows have reasons", () => {
    expect(getPostTreatmentFooterStatus(true, false)).toEqual({
      variant: "ready",
      message: POST_TREATMENT_FOOTER_MESSAGES.ready,
    });
  });

  it("returns mark treatment when nothing is marked as completed", () => {
    expect(getPostTreatmentFooterStatus(false, true)).toEqual({
      variant: "warning",
      message: POST_TREATMENT_FOOTER_MESSAGES.selectTreatment,
    });
  });

  it("returns cancellation reason message when unchecked row lacks reason", () => {
    expect(getPostTreatmentFooterStatus(true, true)).toEqual({
      variant: "warning",
      message: POST_TREATMENT_FOOTER_MESSAGES.justifyUnperformed,
    });
  });
});
