import { NewAttendanceForm } from "../index";

describe("scheduling index exports", () => {
  it("exports NewAttendanceForm", () => {
    expect(NewAttendanceForm).toBeDefined();
    expect(typeof NewAttendanceForm).toBe("function");
  });
});