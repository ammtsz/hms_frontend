import { NewAppointmentForm } from "../index";

describe("scheduling index exports", () => {
  it("exports NewAppointmentForm", () => {
    expect(NewAppointmentForm).toBeDefined();
    expect(typeof NewAppointmentForm).toBe("function");
  });
});