import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PatientListTable } from "../PatientListTable";
import type { PatientBasic } from "@/types/types";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const patients: PatientBasic[] = [
  {
    id: "1",
    name: "John Smith",
    phone: "(555) 123-4567",
    priority: "3",
    status: "T",
  },
];

describe("PatientListTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hides registro column on narrow viewports via sm:table-cell", () => {
    render(
      <PatientListTable
        paginated={patients}
        hasNoPatients={false}
        sortBy="name"
        sortAsc
        handleSort={jest.fn()}
        statusLegend={{ T: "In Treatment" }}
        priorityLegend={{ "3": "Priority 3" }}
      />,
    );

    const registroHeader = screen.getByText("Record").closest("th");
    expect(registroHeader).toHaveClass("hidden", "sm:table-cell");
  });

  it("navigates to patient detail on row click", () => {
    render(
      <PatientListTable
        paginated={patients}
        hasNoPatients={false}
        sortBy={null}
        sortAsc
        handleSort={jest.fn()}
        statusLegend={{ T: "In Treatment" }}
        priorityLegend={{ "3": "Priority 3" }}
      />,
    );

    fireEvent.click(screen.getByText("John Smith").closest("tr")!);
    expect(mockPush).toHaveBeenCalledWith("/patients/1");
  });
});
