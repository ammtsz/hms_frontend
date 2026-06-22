import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "../Button";

describe("Button", () => {
  it("renders children and defaults to type button", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("supports loading state", () => {
    render(
      <Button isLoading loadingText="Saving...">
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving..." });
    expect(button).toBeDisabled();
    expect(button).not.toHaveTextContent("Save");
  });

  it("does not call onClick when disabled by loading", () => {
    const onClick = jest.fn();

    render(
      <Button isLoading onClick={onClick}>
        Save
      </Button>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant, size, and custom classes", () => {
    render(
      <Button variant="outline" size="sm" className="custom-class">
        Cancel
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Cancel" });
    expect(button).toHaveClass("border-gray-300", "min-h-[40px]", "custom-class");
  });

  it("supports start alignment and full width for list-style ghost buttons", () => {
    render(
      <Button variant="ghost" align="start" fullWidth>
        Item
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Item" });
    expect(button).toHaveClass("justify-start", "text-left", "w-full");
  });
});
