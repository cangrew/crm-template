import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickChangeSelect } from "./quick-change-select";

const OPTIONS = [
  { value: "available", label: "Available" },
  { value: "dispatched", label: "Dispatched" },
] as const;

describe("QuickChangeSelect", () => {
  it("renders the badge child and the select options", () => {
    render(
      <QuickChangeSelect value="available" options={OPTIONS} onChange={() => {}}>
        <span data-testid="badge">status badge</span>
      </QuickChangeSelect>,
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("available");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("calls onChange with the selected value", () => {
    const onChange = vi.fn();
    render(
      <QuickChangeSelect value="available" options={OPTIONS} onChange={onChange}>
        <span data-testid="badge">status badge</span>
      </QuickChangeSelect>,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "dispatched" } });
    expect(onChange).toHaveBeenCalledWith("dispatched");
  });

  it("stops click propagation so the surrounding row handler does not fire", () => {
    const rowClick = vi.fn();
    render(
      <div onClick={rowClick}>
        <QuickChangeSelect value="available" options={OPTIONS} onChange={() => {}}>
          <span data-testid="badge">status badge</span>
        </QuickChangeSelect>
      </div>,
    );
    fireEvent.click(screen.getByTestId("badge"));
    expect(rowClick).not.toHaveBeenCalled();
  });
});
