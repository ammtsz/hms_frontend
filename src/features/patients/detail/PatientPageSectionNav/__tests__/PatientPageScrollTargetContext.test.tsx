import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PatientPageScrollTargetProvider,
  usePatientPageScrollTarget,
} from "../PatientPageScrollTargetContext";
import { PATIENT_PAGE_SECTION_IDS } from "../patientPageSectionConfig";

function Consumer() {
  const { scrollTargetSectionId, setScrollTargetSectionId } =
    usePatientPageScrollTarget();
  return (
    <div>
      <span data-testid="scroll-target">{scrollTargetSectionId ?? "null"}</span>
      <button
        type="button"
        onClick={() => setScrollTargetSectionId(PATIENT_PAGE_SECTION_IDS.notes)}
      >
        Set notes
      </button>
      <button type="button" onClick={() => setScrollTargetSectionId(null)}>
        Clear
      </button>
    </div>
  );
}

describe("PatientPageScrollTargetContext", () => {
  it("returns null and no-op setter when used outside provider", async () => {
    const user = userEvent.setup();
    render(<Consumer />);
    expect(screen.getByTestId("scroll-target")).toHaveTextContent("null");
    await user.click(screen.getByRole("button", { name: "Set notes" }));
    expect(screen.getByTestId("scroll-target")).toHaveTextContent("null");
  });

  it("provides scroll target state when inside provider", async () => {
    const user = userEvent.setup();
    render(
      <PatientPageScrollTargetProvider>
        <Consumer />
      </PatientPageScrollTargetProvider>,
    );
    expect(screen.getByTestId("scroll-target")).toHaveTextContent("null");

    await user.click(screen.getByRole("button", { name: "Set notes" }));
    expect(screen.getByTestId("scroll-target")).toHaveTextContent(
      PATIENT_PAGE_SECTION_IDS.notes,
    );

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("scroll-target")).toHaveTextContent("null");
  });
});
