import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DetailCardCollapsibleHeader } from "../DetailCardCollapsibleHeader";

describe("DetailCardCollapsibleHeader", () => {
  const onToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onToggle when the title row is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DetailCardCollapsibleHeader
        isCollapsed={true}
        onToggle={onToggle}
        title="Anotações"
      />,
    );

    await user.click(screen.getByRole("heading", { name: /anotações/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not call onToggle when an action button is clicked", async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    render(
      <DetailCardCollapsibleHeader
        isCollapsed={false}
        onToggle={onToggle}
        title="Seção"
        actions={
          <button type="button" onClick={onAction}>
            Ação
          </button>
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: /ação/i }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("exposes aria-expanded when expanded", () => {
    render(
      <DetailCardCollapsibleHeader
        isCollapsed={false}
        onToggle={onToggle}
        title="Seção"
      />,
    );

    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("applies bottom margin when expanded", () => {
    const { container } = render(
      <DetailCardCollapsibleHeader
        isCollapsed={false}
        onToggle={onToggle}
        title="Seção"
      />,
    );

    expect(container.querySelector(".mb-4")).toBeInTheDocument();
  });
});
