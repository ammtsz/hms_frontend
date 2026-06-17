import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HolidayListCard } from "../HolidayListCard";
import type { HolidayGroup } from "@/utils/holidayGrouping";

const mockGroup: HolidayGroup = {
  groupId: null,
  holidays: [
    {
      id: 1,
      holidayDate: "2026-12-25",
      name: "Natal",
      description: "Feriado Nacional",
      holidayGroupId: null,
      createdDate: "2026-01-01",
      updatedDate: "2026-01-01",
    },
  ],
  dateRange: "25/12/2026",
  displayName: "Natal",
  description: "Feriado Nacional",
  isPeriod: false,
};

describe("HolidayListCard", () => {
  it("renders holiday fields and action buttons", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <HolidayListCard group={mockGroup} onEdit={onEdit} onDelete={onDelete} />,
    );

    expect(screen.getByText("25/12/2026")).toBeInTheDocument();
    expect(screen.getByText("Natal")).toBeInTheDocument();
    expect(screen.getByText("Feriado Nacional")).toBeInTheDocument();
    expect(screen.getByText("1 dia")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(mockGroup.holidays[0]);

    fireEvent.click(screen.getByRole("button", { name: /excluir/i }));
    expect(onDelete).toHaveBeenCalledWith(mockGroup.holidays[0]);
  });
});
