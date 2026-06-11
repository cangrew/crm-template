import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormModal } from "./form-modal";

function setup(props: Partial<React.ComponentProps<typeof FormModal>> = {}) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <FormModal open onClose={onClose} title="New contact" onSubmit={onSubmit} {...props}>
      <input aria-label="Name" />
    </FormModal>,
  );
  return { onSubmit, onClose };
}

describe("FormModal", () => {
  it("renders the title and form body", () => {
    setup();
    expect(screen.getByRole("heading", { name: "New contact" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("submits via the primary button", () => {
    const { onSubmit } = setup({ submitLabel: "Create" });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the pending label and disables submit while pending", () => {
    setup({ isPending: true, submitLabel: "Create", pendingLabel: "Saving…" });
    const btn = screen.getByRole("button", { name: "Saving…" });
    expect(btn).toBeDisabled();
  });

  it("renders nothing when closed", () => {
    render(
      <FormModal open={false} onClose={() => {}} title="Hidden" onSubmit={() => {}}>
        <input aria-label="Name" />
      </FormModal>,
    );
    expect(screen.queryByRole("heading", { name: "Hidden" })).not.toBeInTheDocument();
  });
});
