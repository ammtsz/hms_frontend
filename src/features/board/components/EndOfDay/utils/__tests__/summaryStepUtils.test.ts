import {
  aggregateByKey,
  groupRescheduledByPatient,
  groupCancelledByPatient,
  groupCouldNotRescheduleByPatient,
  type RescheduledItem,
  type CancelledForFItem,
  type CouldNotRescheduleItem,
} from "../summaryStepUtils";

describe("summaryStepUtils", () => {
  describe("aggregateByKey", () => {
    it("returns empty array for empty input", () => {
      const result = aggregateByKey(
        [],
        (x: { id: number }) => String(x.id),
        (item, count) => ({ id: item.id, count }),
      );
      expect(result).toEqual([]);
    });

    it("groups items by key and applies toResult with count", () => {
      const items = [
        { id: 1, type: "a" },
        { id: 2, type: "a" },
        { id: 3, type: "b" },
      ];
      const result = aggregateByKey(
        items,
        (x) => x.type,
        (item, count) => ({ type: item.type, count }),
      );
      expect(result).toHaveLength(2);
      const byType = Object.fromEntries(result.map((r) => [r.type, r.count]));
      expect(byType).toEqual({ a: 2, b: 1 });
    });

    it("sorts result when sortCompare is provided", () => {
      const items = [
        { id: 1, type: "b" },
        { id: 2, type: "a" },
        { id: 3, type: "c" },
      ];
      const result = aggregateByKey(
        items,
        (x) => x.type,
        (item, count) => ({ type: item.type, count }),
        (a, b) => a.type.localeCompare(b.type),
      );
      expect(result.map((r) => r.type)).toEqual(["a", "b", "c"]);
    });
  });

  describe("groupRescheduledByPatient", () => {
    it("returns empty array for empty input", () => {
      expect(groupRescheduledByPatient([])).toEqual([]);
    });

    it("groups by patient and aggregates by type+oldDate+newDate", () => {
      const items: RescheduledItem[] = [
        {
          appointmentId: 1,
          patientId: 10,
          patientName: "John",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
        {
          appointmentId: 2,
          patientId: 10,
          patientName: "John",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
        {
          appointmentId: 3,
          patientId: 10,
          patientName: "John",
          type: "assessment",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ];
      const result = groupRescheduledByPatient(items);
      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe("John");
      expect(result[0].patientId).toBe(10);
      expect(result[0].appointments).toHaveLength(2);
      const physiotherapy = result[0].appointments.find((a) => a.type === "physiotherapy");
      const assessment = result[0].appointments.find((a) => a.type === "assessment");
      expect(physiotherapy?.count).toBe(2);
      expect(assessment?.count).toBe(1);
    });

    it("sorts patients by first oldDate", () => {
      const items: RescheduledItem[] = [
        {
          appointmentId: 2,
          patientId: 2,
          patientName: "Bob",
          type: "assessment",
          oldDate: "2024-01-22",
          newDate: "2024-01-29",
        },
        {
          appointmentId: 1,
          patientId: 1,
          patientName: "Alice",
          type: "assessment",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ];
      const result = groupRescheduledByPatient(items);
      expect(result[0].patientName).toBe("Alice");
      expect(result[1].patientName).toBe("Bob");
    });

    it("uses Patient when patientName is missing", () => {
      const items: RescheduledItem[] = [
        {
          appointmentId: 1,
          patientId: 99,
          patientName: "",
          type: "assessment",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ];
      const result = groupRescheduledByPatient(items);
      expect(result[0].patientName).toMatch(/Patient|Patient/);
    });
  });

  describe("groupCancelledByPatient", () => {
    it("returns empty array for empty input", () => {
      expect(groupCancelledByPatient([])).toEqual([]);
    });

    it("aggregates appointments by type and scheduledDate within each patient", () => {
      const items: CancelledForFItem[] = [
        {
          patientId: 1,
          patientName: "Jane",
          appointments: [
            { id: 1, type: "physiotherapy", scheduledDate: "2024-01-20" },
            { id: 2, type: "physiotherapy", scheduledDate: "2024-01-20" },
            { id: 3, type: "assessment", scheduledDate: "2024-01-21" },
          ],
        },
      ];
      const result = groupCancelledByPatient(items);
      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe("Jane");
      expect(result[0].appointments).toHaveLength(2);
      const physiotherapy = result[0].appointments.find((a) => a.type === "physiotherapy");
      expect(physiotherapy?.count).toBe(2);
      expect(result[0].appointments.find((a) => a.type === "assessment")?.count).toBe(1);
    });

    it("sorts by patientName", () => {
      const items: CancelledForFItem[] = [
        { patientId: 2, patientName: "Bob", appointments: [] },
        { patientId: 1, patientName: "Alice", appointments: [] },
      ];
      const result = groupCancelledByPatient(items);
      expect(result[0].patientName).toBe("Alice");
      expect(result[1].patientName).toBe("Bob");
    });
  });

  describe("groupCouldNotRescheduleByPatient", () => {
    it("returns empty array for empty input", () => {
      expect(groupCouldNotRescheduleByPatient([])).toEqual([]);
    });

    it("groups by patient and aggregates by type+reason", () => {
      const items: CouldNotRescheduleItem[] = [
        {
          appointmentId: 1,
          patientId: 5,
          patientName: "Carl",
          type: "physiotherapy",
          reason: "No slots",
        },
        {
          appointmentId: 2,
          patientId: 5,
          patientName: "Carl",
          type: "physiotherapy",
          reason: "No slots",
        },
      ];
      const result = groupCouldNotRescheduleByPatient(items);
      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe("Carl");
      expect(result[0].appointments).toHaveLength(1);
      expect(result[0].appointments[0].count).toBe(2);
      expect(result[0].appointments[0].reason).toBe("No slots");
    });

    it("sorts by patientName", () => {
      const items: CouldNotRescheduleItem[] = [
        {
          appointmentId: 1,
          patientId: 2,
          patientName: "Zara",
          type: "assessment",
          reason: "X",
        },
        {
          appointmentId: 2,
          patientId: 1,
          patientName: "Anna",
          type: "assessment",
          reason: "Y",
        },
      ];
      const result = groupCouldNotRescheduleByPatient(items);
      expect(result[0].patientName).toBe("Anna");
      expect(result[1].patientName).toBe("Zara");
    });
  });
});
