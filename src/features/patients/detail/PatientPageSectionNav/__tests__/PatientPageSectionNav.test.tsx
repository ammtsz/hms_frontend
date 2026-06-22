import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PatientPageSectionNav } from "../PatientPageSectionNav";
import { PATIENT_PAGE_SECTION_IDS } from "../patientPageSectionConfig";

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
const mockUnobserve = jest.fn();

beforeAll(() => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: mockUnobserve,
  }));
});

describe("PatientPageSectionNav", () => {
  beforeEach(() => {
    // Create section elements so scrollIntoView has targets and IntersectionObserver can attach
    Object.values(PATIENT_PAGE_SECTION_IDS).forEach((id) => {
      const el = document.createElement("div");
      el.id = id;
      el.scrollIntoView = jest.fn();
      document.body.appendChild(el);
    });
  });

  afterEach(() => {
    Object.values(PATIENT_PAGE_SECTION_IDS).forEach((id) => {
      document.getElementById(id)?.remove();
    });
  });

  it("renders desktop nav with aria-label", () => {
    render(<PatientPageSectionNav />);
    expect(
      screen.getByRole("navigation", {
        name: "Patient page section navigation",
      }),
    ).toBeInTheDocument();
  });

  it("renders all section buttons in the nav", () => {
    render(<PatientPageSectionNav />);
    const nav = screen.getByRole("navigation", {
      name: "Patient page section navigation",
    });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(6);
  });

  it("scrolls to section when a nav button is clicked", async () => {
    const user = userEvent.setup();
    render(<PatientPageSectionNav />);
    const nav = screen.getByRole("navigation", {
      name: "Patient page section navigation",
    });
    const buttons = within(nav).getAllByRole("button");
    const firstButton = buttons[0];

    await user.click(firstButton);
    await new Promise((r) => setTimeout(r, 200));

    const target = document.getElementById(PATIENT_PAGE_SECTION_IDS.header);
    expect(target?.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("renders small-screen trigger with accessible label", () => {
    render(<PatientPageSectionNav />);
    const trigger = screen.getByRole("button", {
      name: "Open section menu",
    });
    expect(trigger).toBeInTheDocument();
  });

  it("opens and closes small-screen panel when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<PatientPageSectionNav />);
    const trigger = screen.getByRole("button", {
      name: "Open section menu",
    });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Page sections" });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Profile" }),
    ).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes small-screen panel when a section is clicked", async () => {
    const user = userEvent.setup();
    render(<PatientPageSectionNav />);
    await user.click(
      screen.getByRole("button", { name: "Open section menu" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Page sections" });
    await user.click(within(dialog).getByRole("button", { name: "Notes" }));

    expect(
      screen.queryByRole("dialog", { name: "Page sections" }),
    ).not.toBeInTheDocument();
  });
});
