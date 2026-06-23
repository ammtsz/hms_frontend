import {
  groupAbsenceJustificationsByCard,
  getAbsenceCardLabelParts,
  groupAppointmentsForDisplayWithBodyLocation,
  type AbsenceCard,
} from "../confirmationStepUtils";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import type { AbsenceJustification, ScheduledAbsence } from "../../types";
import type { IAppointmentStatusDetailWithType } from "../../../../utils/appointmentDataUtils";

const createScheduledAbsence = (
  overrides: Partial<ScheduledAbsence> = {},
): ScheduledAbsence => ({
  patientId: 1,
  patientName: "John Doe",
  appointmentType: "assessment",
  ...overrides,
});

const createAbsenceJustification = (
  overrides: Partial<AbsenceJustification> = {},
): AbsenceJustification => ({
  patientId: 1,
  patientName: "John Doe",
  appointmentType: "assessment",
  justified: true,
  justification: "Medical appointment",
  ...overrides,
});

const createAppointment = (
  overrides: Partial<IAppointmentStatusDetailWithType> = {},
): IAppointmentStatusDetailWithType => ({
  name: "John Doe",
  priority: "3",
  patientId: 1,
  appointmentType: "assessment",
  ...overrides,
});

describe("confirmationStepUtils", () => {
  describe("groupAbsenceJustificationsByCard", () => {
    it("groups assessment absences as one card", () => {
      const scheduledAbsences = [
        createScheduledAbsence({ patientId: 1, patientName: "John", appointmentType: "assessment" }),
      ];
      const justifications = [
        createAbsenceJustification({ patientId: 1, appointmentType: "assessment", justified: true }),
      ];

      const result = groupAbsenceJustificationsByCard(scheduledAbsences, justifications);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        patientId: 1,
        patientName: "John",
        hasAssessment: true,
        physiotherapyCount: 0,
        tensCount: 0,
        justified: true,
      });
    });

    it("groups treatments (physiotherapy + tens) as one card", () => {
      const scheduledAbsences = [
        createScheduledAbsence({ patientId: 1, appointmentType: "physiotherapy" }),
        createScheduledAbsence({ patientId: 1, appointmentType: "tens" }),
      ];
      const justifications = [
        createAbsenceJustification({ patientId: 1, appointmentType: "physiotherapy", justified: false }),
      ];

      const result = groupAbsenceJustificationsByCard(scheduledAbsences, justifications);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        patientId: 1,
        hasAssessment: false,
        physiotherapyCount: 1,
        tensCount: 1,
        justified: false,
      });
    });

    it("creates two cards when patient has assessment and treatments", () => {
      const scheduledAbsences = [
        createScheduledAbsence({ patientId: 1, appointmentType: "assessment" }),
        createScheduledAbsence({ patientId: 1, appointmentType: "physiotherapy" }),
      ];
      const justifications = [
        createAbsenceJustification({ patientId: 1, appointmentType: "assessment", justified: true }),
        createAbsenceJustification({ patientId: 1, appointmentType: "physiotherapy", justified: false }),
      ];

      const result = groupAbsenceJustificationsByCard(scheduledAbsences, justifications);

      expect(result).toHaveLength(2);
      expect(result[0].hasAssessment).toBe(true);
      expect(result[1].hasAssessment).toBe(false);
    });

    it("derives from justifications when scheduledAbsences is empty", () => {
      const scheduledAbsences: ScheduledAbsence[] = [];
      const justifications = [
        createAbsenceJustification({ patientId: 1, appointmentType: "assessment", justified: true }),
      ];

      const result = groupAbsenceJustificationsByCard(scheduledAbsences, justifications);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        patientId: 1,
        hasAssessment: true,
        justified: true,
      });
    });

    it("returns empty array when both inputs are empty", () => {
      const result = groupAbsenceJustificationsByCard([], []);

      expect(result).toEqual([]);
    });
  });

  describe("getAbsenceCardLabelParts", () => {
    it("returns Assessment Consultation for assessment card", () => {
      const card: AbsenceCard = {
        patientId: 1,
        patientName: "John",
        hasAssessment: true,
        physiotherapyCount: 0,
        tensCount: 0,
        justified: true,
      };

      const result = getAbsenceCardLabelParts(card);

      expect(result).toEqual([getAppointmentTypeLabel("assessment")]);
    });

    it("returns Physiotherapy with locations for physiotherapy-only card", () => {
      const card: AbsenceCard = {
        patientId: 1,
        patientName: "John",
        hasAssessment: false,
        physiotherapyCount: 1,
        tensCount: 0,
        justified: false,
      };

      const result = getAbsenceCardLabelParts(card);

      expect(result).toEqual([
        `${getAppointmentTypeLabel("physiotherapy")} (1 location)`,
      ]);
    });

    it("returns TENS with locations for tens-only card", () => {
      const card: AbsenceCard = {
        patientId: 1,
        patientName: "John",
        hasAssessment: false,
        physiotherapyCount: 0,
        tensCount: 2,
        justified: false,
      };

      const result = getAbsenceCardLabelParts(card);

      expect(result).toEqual([
        `${getAppointmentTypeLabel("tens")} (2 locations)`,
      ]);
    });

    it("returns both treatment labels for combined treatments", () => {
      const card: AbsenceCard = {
        patientId: 1,
        patientName: "John",
        hasAssessment: false,
        physiotherapyCount: 1,
        tensCount: 1,
        justified: false,
      };

      const result = getAbsenceCardLabelParts(card);

      expect(result).toHaveLength(2);
      expect(result).toContain(
        `${getAppointmentTypeLabel("physiotherapy")} (1 location)`,
      );
      expect(result).toContain(`${getAppointmentTypeLabel("tens")} (1 location)`);
    });
  });

  describe("groupAppointmentsForDisplayWithBodyLocation", () => {
    it("groups assessment appointment as one entry", () => {
      const appointments = [
        createAppointment({ name: "John", patientId: 1, appointmentType: "assessment" }),
      ];

      const result = groupAppointmentsForDisplayWithBodyLocation(appointments);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        patientName: "John",
        label: getAppointmentTypeLabel("assessment"),
      });
    });

    it("groups physiotherapy appointment with locations count", () => {
      const appointments = [
        createAppointment({ name: "Jane", patientId: 2, appointmentType: "physiotherapy" }),
      ];

      const result = groupAppointmentsForDisplayWithBodyLocation(appointments);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe(
        `${getAppointmentTypeLabel("physiotherapy")} - 1 location`,
      );
    });

    it("groups tens appointment with locations count", () => {
      const appointments = [
        createAppointment({ name: "Bob", patientId: 3, appointmentType: "tens" }),
      ];

      const result = groupAppointmentsForDisplayWithBodyLocation(appointments);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe(`${getAppointmentTypeLabel("tens")} - 1 location`);
    });

    it("groups patient with assessment and treatments as two entries", () => {
      const appointments = [
        createAppointment({ name: "Patient 10", patientId: 10, appointmentType: "assessment" }),
        createAppointment({ name: "Patient 10", patientId: 10, appointmentType: "physiotherapy" }),
        createAppointment({ name: "Patient 10", patientId: 10, appointmentType: "tens" }),
      ];

      const result = groupAppointmentsForDisplayWithBodyLocation(appointments);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe(getAppointmentTypeLabel("assessment"));
      expect(result[1].label).toBe(
        `${getAppointmentTypeLabel("physiotherapy")} - 1 location and ${getAppointmentTypeLabel("tens")} - 1 location`,
      );
    });

    it("groups patient with both physiotherapy and tens as one entry", () => {
      const appointments = [
        createAppointment({ name: "Patient D", patientId: 4, appointmentType: "physiotherapy" }),
        createAppointment({ name: "Patient D", patientId: 4, appointmentType: "tens" }),
      ];

      const result = groupAppointmentsForDisplayWithBodyLocation(appointments);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe(
        `${getAppointmentTypeLabel("physiotherapy")} - 1 location and ${getAppointmentTypeLabel("tens")} - 1 location`,
      );
    });

    it("uses plural locations for multiple treatments of same type", () => {
      const appointments = [
        createAppointment({ name: "Patient", patientId: 5, appointmentType: "physiotherapy" }),
        createAppointment({ name: "Patient", patientId: 5, appointmentType: "physiotherapy" }),
      ];

      const result = groupAppointmentsForDisplayWithBodyLocation(appointments);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe(
        `${getAppointmentTypeLabel("physiotherapy")} - 2 locations`,
      );
    });

    it("handles appointments without patientId using name as key", () => {
      const appointments = [
        createAppointment({ name: "Unknown", patientId: undefined, appointmentType: "assessment" }),
      ];

      const result = groupAppointmentsForDisplayWithBodyLocation(appointments);

      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe("Unknown");
    });

    it("returns empty array for empty input", () => {
      const result = groupAppointmentsForDisplayWithBodyLocation([]);

      expect(result).toEqual([]);
    });
  });
});
