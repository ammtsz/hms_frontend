import { render, screen } from "@testing-library/react";
import { MobileDesktopDnDAlert } from "../MobileDesktopDnDAlert";

describe("MobileDesktopDnDAlert", () => {
  it("renders informational message when show is true", () => {
    render(<MobileDesktopDnDAlert show />);

    expect(
      screen.getByText(/Movimentação entre colunas/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/use um computador/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("lg:hidden");
  });

  it("renders nothing when show is false", () => {
    const { container } = render(<MobileDesktopDnDAlert show={false} />);

    expect(container.firstChild).toBeNull();
  });
});
