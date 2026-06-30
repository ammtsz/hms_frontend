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
      name: "Christmas",
      description: "Federal Statutory Holiday",
      holidayGroupId: null,
      createdDate: "2026-01-01",
      updatedDate: "2026-01-01",
    },
  ],
  dateRange: "12/25/2026",
  displayName: "Christmas",
  description: "Federal Statutory Holiday",
  isPeriod: false,
};

describe("HolidayListCard", () => {
  it("renders holiday fields and action buttons", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <HolidayListCard group={mockGroup} onEdit={onEdit} onDelete={onDelete} />,
    );

    expect(screen.getByText("12/25/2026")).toBeInTheDocument();
    expect(screen.getByText("Christmas")).toBeInTheDocument();
    expect(screen.getByText("Federal Statutory Holiday")).toBeInTheDocument();
    expect(screen.getByText("1 day")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockGroup.holidays[0]);

    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));
    expect(onDelete).toHaveBeenCalledWith(mockGroup.holidays[0]);
  });
});
