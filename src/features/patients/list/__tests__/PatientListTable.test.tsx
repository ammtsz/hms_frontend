import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PatientListTable } from "../PatientListTable";

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

const patients = [
  {
    id: "1",
    name: "João Silva",
    phone: "(11) 99999-9999",
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
        statusLegend={{ T: "Em Tratamento" }}
        priorityLegend={{ "3": "Padrão" }}
      />,
    );

    const registroHeader = screen.getByText("Registro").closest("th");
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
        statusLegend={{ T: "Em Tratamento" }}
        priorityLegend={{ "3": "Padrão" }}
      />,
    );

    fireEvent.click(screen.getByText("João Silva").closest("tr")!);
    expect(mockPush).toHaveBeenCalledWith("/patients/1");
  });
});
