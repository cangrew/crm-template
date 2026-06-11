import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewContactModal } from "./new-contact-modal";

const { createMutate, toastFn } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  toastFn: vi.fn(),
}));

vi.mock("@/lib/data/hooks", () => ({
  useCreateContact: () => ({ mutate: createMutate, isPending: false }),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => toastFn,
}));

describe("NewContactModal", () => {
  beforeEach(() => {
    createMutate.mockReset();
    toastFn.mockReset();
  });

  it("shows an inline error and does not submit when the name is missing", async () => {
    render(<NewContactModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("rejects a malformed email with an inline error", async () => {
    render(<NewContactModal open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Pat" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits a trimmed payload and closes on success", async () => {
    const onClose = vi.fn();
    createMutate.mockImplementation((_input, opts) => opts?.onSuccess?.());
    render(<NewContactModal open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "  Pat Jones  " } });
    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: "Acme Co" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "pat@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0][0]).toEqual({
      name: "Pat Jones",
      status: "lead",
      company: "Acme Co",
      email: "pat@example.com",
      phone: undefined,
      notes: undefined,
    });
    expect(onClose).toHaveBeenCalled();
    expect(toastFn).toHaveBeenCalledWith("Contact added", "success");
  });
});
