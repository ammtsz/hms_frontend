import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "../index";

describe("Table and IconButton", () => {
  it("renders a responsive table structure", () => {
    render(
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead align="center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell align="center">Active</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>,
    );

    const table = screen.getByRole("table");
    expect(within(table).getByText("Name")).toBeInTheDocument();
    expect(within(table).getByText("Patient")).toBeInTheDocument();
    expect(screen.getByText("Status")).toHaveClass("text-center");
  });

  it("renders an accessible icon button", () => {
    const onClick = jest.fn();

    render(
      <IconButton aria-label="Edit" tone="primary" onClick={onClick}>
        E
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Edit" });
    expect(button).toHaveClass("text-blue-600", "min-h-[44px]", "min-w-[44px]");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
