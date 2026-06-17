import {
  defaultPriorityFromSorted,
  filterActivePriorityOptions,
  pickFallbackPriorityValue,
  sortPriorityOptionsBySortOrder,
} from "../priorityOptions";
import { SystemOptionType } from "@/types/systemOptions";

const opt = (
  value: string,
  sortOrder: number,
  isActive: boolean,
  label: string,
) => ({
  id: sortOrder,
  type: SystemOptionType.PRIORITY,
  value,
  label,
  isActive,
  sortOrder,
  createdAt: "",
  updatedAt: "",
});

describe("priorityOptions", () => {
  describe("sortPriorityOptionsBySortOrder", () => {
    it("sorts by sortOrder then value", () => {
      const sorted = sortPriorityOptionsBySortOrder([
        opt("3", 3, true, "c"),
        opt("1", 1, true, "a"),
        opt("2", 2, true, "b"),
      ]);
      expect(sorted.map((p) => p.value)).toEqual(["1", "2", "3"]);
    });

    it("does not mutate input", () => {
      const input = [opt("2", 2, true, "b"), opt("1", 1, true, "a")];
      const copy = [...input];
      sortPriorityOptionsBySortOrder(input);
      expect(input).toEqual(copy);
    });
  });

  describe("filterActivePriorityOptions", () => {
    it("keeps only active and sorts", () => {
      const result = filterActivePriorityOptions([
        opt("3", 3, false, "x"),
        opt("1", 1, true, "a"),
        opt("2", 2, true, "b"),
      ]);
      expect(result.map((p) => p.value)).toEqual(["1", "2"]);
    });
  });

  describe("pickFallbackPriorityValue", () => {
    const sorted = [
      opt("1", 1, true, "a"),
      opt("2", 2, true, "b"),
    ];

    it("returns first when position is first", () => {
      expect(pickFallbackPriorityValue(sorted, "first")).toBe("1");
    });

    it("returns last when position is last", () => {
      expect(pickFallbackPriorityValue(sorted, "last")).toBe("2");
    });

    it("returns undefined when empty", () => {
      expect(pickFallbackPriorityValue([], "first")).toBeUndefined();
    });
  });

  describe("defaultPriorityFromSorted", () => {
    it("uses whenEmpty when list is empty", () => {
      expect(defaultPriorityFromSorted([], "last", "5")).toBe("5");
    });
  });
});
