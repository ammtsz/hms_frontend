/**
 * scheduleErrorMessages utility tests
 */
import {
  DAY_NAMES_PT,
  getNoScheduleReasonForNewPatient,
} from "../scheduleErrorMessages";

describe("scheduleErrorMessages", () => {
  describe("DAY_NAMES_PT", () => {
    it("has 7 day names (Sunday to Saturday)", () => {
      expect(DAY_NAMES_PT).toHaveLength(7);
      expect(DAY_NAMES_PT[0]).toBe("domingo");
      expect(DAY_NAMES_PT[6]).toBe("sábado");
    });
  });

  describe("getNoScheduleReasonForNewPatient", () => {
    it("returns null when error does not match scheduling settings pattern", () => {
      expect(getNoScheduleReasonForNewPatient("Patient not found")).toBeNull();
      expect(getNoScheduleReasonForNewPatient("Network error")).toBeNull();
    });

    it("returns friendly reason with day name when error contains 'day N' and scheduling pattern", () => {
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings for day 0")
      ).toBe("não há atendimentos de domingo");
      expect(
        getNoScheduleReasonForNewPatient("Não há configuração de agenda day 1")
      ).toBe("não há atendimentos de segunda-feira");
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings day 6")
      ).toBe("não há atendimentos de sábado");
    });

    it("matches 'day N' case-insensitively", () => {
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings DAY 2")
      ).toBe("não há atendimentos de terça-feira");
    });

    it("returns generic message when pattern matches but no valid day number", () => {
      expect(
        getNoScheduleReasonForNewPatient("Não há configuração de agenda")
      ).toBe("não há atendimentos para o dia selecionado");
    });

    it("returns generic message when day number is out of range", () => {
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings day 7")
      ).toBe("não há atendimentos para o dia selecionado");
    });
  });
});
