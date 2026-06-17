import { getStatusConfig, getTreatmentTypeLabel } from "../utils";

describe("AttendanceHistory Utils", () => {
  describe("getStatusConfig", () => {
    it("should return correct config for missed status", () => {
      const config = getStatusConfig("missed");

      expect(config.label).toBe("Falta");
      expect(config.badgeClass).toContain("bg-red-100");
      expect(config.badgeClass).toContain("text-red-800");
      expect(config.badgeClass).toContain("border-red-300");
      expect(config.borderColor).toBe("border border-gray-50");
      expect(config.icon).not.toBeNull();
    });

    it("should return correct config for cancelled status", () => {
      const config = getStatusConfig("cancelled");

      expect(config.label).toBe("Cancelado");
      expect(config.badgeClass).toContain("bg-orange-100");
      expect(config.badgeClass).toContain("text-orange-800");
      expect(config.badgeClass).toContain("border-orange-300");
      expect(config.borderColor).toBe("border border-gray-50");
      expect(config.icon).not.toBeNull();
    });

    it("should return correct config for completed status", () => {
      const config = getStatusConfig("completed");

      expect(config.label).toBe("Concluído");
      expect(config.badgeClass).toContain("bg-green-100");
      expect(config.badgeClass).toContain("text-green-800");
      expect(config.badgeClass).toContain("border-green-300");
      expect(config.borderColor).toBe("border-gray-200");
      expect(config.icon).toBeNull();
    });

    it("should return completed config for undefined status", () => {
      const config = getStatusConfig(undefined);

      expect(config.label).toBe("Concluído");
      expect(config.badgeClass).toContain("bg-green-100");
      expect(config.borderColor).toBe("border-gray-200");
      expect(config.icon).toBeNull();
    });

    it("should return completed config for unknown status", () => {
      const config = getStatusConfig("unknown");

      expect(config.label).toBe("Concluído");
      expect(config.badgeClass).toContain("bg-green-100");
      expect(config.borderColor).toBe("border-gray-200");
      expect(config.icon).toBeNull();
    });
  });

  describe("getTreatmentTypeLabel", () => {
    it("should return Consulta when only assessment is true", () => {
      const label = getTreatmentTypeLabel(true, false, false);
      expect(label).toBe("Consulta de Avaliação");
    });

    it("should return Consulta e Fisioterapia when assessment and physiotherapy", () => {
      const label = getTreatmentTypeLabel(true, true, false);
      expect(label).toBe("Consulta de Avaliação e Fisioterapia");
    });

    it("should return Consulta e TENS when assessment and tens", () => {
      const label = getTreatmentTypeLabel(true, false, true);
      expect(label).toBe("Consulta de Avaliação e TENS");
    });

    it("should return Consulta, Fisioterapia e TENS when all three treatments exist", () => {
      const label = getTreatmentTypeLabel(true, true, true);
      expect(label).toBe("Consulta de Avaliação, Fisioterapia e TENS");
    });

    it("should return Fisioterapia e TENS when both physical treatments exist", () => {
      const label = getTreatmentTypeLabel(false, true, true);
      expect(label).toBe("Fisioterapia e TENS");
    });

    it("should return Fisioterapia when only physiotherapy exists", () => {
      const label = getTreatmentTypeLabel(false, true, false);
      expect(label).toBe("Fisioterapia");
    });

    it("should return TENS when only tens exists", () => {
      const label = getTreatmentTypeLabel(false, false, true);
      expect(label).toBe("TENS");
    });

    it("should return Não especificado when no treatment exists", () => {
      const label = getTreatmentTypeLabel(false, false, false);
      expect(label).toBe("Não especificado");
    });
  });
});
