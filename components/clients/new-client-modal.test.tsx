import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewClientModal } from "./new-client-modal";

const { createMutate, toastFn } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  toastFn: vi.fn(),
}));

vi.mock("@/lib/data/hooks", () => ({
  useCreateClient: () => ({ mutate: createMutate, isPending: false }),
  useAgents: () => ({ data: [{ id: "a1", full_name: "Casey Agent" }] }),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => toastFn,
}));

describe("NewClientModal", () => {
  beforeEach(() => {
    createMutate.mockReset();
    toastFn.mockReset();
  });

  it("shows inline errors and does not submit when the names are missing", async () => {
    render(<NewClientModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("First name is required.")).toBeInTheDocument();
    expect(await screen.findByText("Last name is required.")).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("rejects a malformed email with an inline error", async () => {
    render(<NewClientModal open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Pat" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Jones" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits a trimmed payload and closes on success", async () => {
    const onClose = vi.fn();
    createMutate.mockImplementation((_input, opts) => opts?.onSuccess?.());
    render(<NewClientModal open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "  Pat  " } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: " Jones " } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "pat@example.com" } });
    fireEvent.change(screen.getByLabelText(/agent/i), { target: { value: "a1" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0][0]).toEqual({
      first_name: "Pat",
      last_name: "Jones",
      status: "prospect",
      dob: null,
      email: "pat@example.com",
      phone: undefined,
      address: undefined,
      agent_id: "a1",
      notes: undefined,
    });
    expect(onClose).toHaveBeenCalled();
    expect(toastFn).toHaveBeenCalledWith("Client added", "success");
  });

  it("sends a null agent when the select is left on Unassigned", async () => {
    createMutate.mockImplementation((_input, opts) => opts?.onSuccess?.());
    render(<NewClientModal open onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Sam" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Reed" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0][0]).toMatchObject({ agent_id: null });
  });
});
