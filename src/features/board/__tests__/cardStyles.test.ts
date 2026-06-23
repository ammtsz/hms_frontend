import {
  getTypeBasedStyles,
  getStatusColor,
  getStatusLabel,
  ATTENDANCE_BOARD_STATUS_LABELS,
} from "../styles/cardStyles";

describe("cardStyles utilities", () => {
  describe("getTypeBasedStyles", () => {
    it("should return blue border for tens type", () => {
      expect(getTypeBasedStyles("tens")).toContain("border-l-blue-400");
    });

    it("should return yellow border for physiotherapy type", () => {
      expect(getTypeBasedStyles("physiotherapy")).toContain("border-l-yellow-400");
    });

    it("should return gray border for assessment type", () => {
      expect(getTypeBasedStyles("assessment")).toContain("border-l-gray-400");
    });
  });

  describe("getStatusColor", () => {
    it("should return correct colors for each status", () => {
      expect(getStatusColor("scheduled")).toBe("text-blue-600");
      expect(getStatusColor("checkedIn")).toBe("text-red-600");
      expect(getStatusColor("onGoing")).toBe("text-yellow-600");
      expect(getStatusColor("completed")).toBe("text-green-600");
    });
  });

  describe("getStatusLabel", () => {
    it("should return correct labels for each status", () => {
      expect(getStatusLabel("scheduled")).toBe(
        ATTENDANCE_BOARD_STATUS_LABELS.scheduled,
      );
      expect(getStatusLabel("checkedIn")).toBe(
        ATTENDANCE_BOARD_STATUS_LABELS.checkedIn,
      );
      expect(getStatusLabel("onGoing")).toBe(
        ATTENDANCE_BOARD_STATUS_LABELS.onGoing,
      );
      expect(getStatusLabel("completed")).toBe(
        ATTENDANCE_BOARD_STATUS_LABELS.completed,
      );
    });
  });
});
