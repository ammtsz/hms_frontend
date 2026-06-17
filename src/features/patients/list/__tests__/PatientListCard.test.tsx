import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PatientListCard } from "../PatientListCard";

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

const patient = {
  id: "1",
  name: "João Silva",
  phone: "(11) 99999-9999",
  priority: "3",
  status: "T",
};

describe("PatientListCard", () => {
  it("renders patient fields and links to detail", () => {
    render(
      <PatientListCard
        patient={patient}
        statusLegend={{ T: "Em Tratamento" }}
        priorityLegend={{ "3": "Padrão" }}
      />,
    );

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("(11) 99999-9999")).toBeInTheDocument();
    expect(screen.getByText("Em Tratamento")).toBeInTheDocument();
    expect(screen.getByText("Padrão")).toBeInTheDocument();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/patients/1");
  });
});
