import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockPush = vi.fn();
const mockRefetch = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockToast = vi.fn();
const mockEditStart = vi.fn();
const mockEditCancel = vi.fn();
const mockEditSave = vi.fn();
const mockEditFinish = vi.fn();

let clientData: unknown = null;
let clientIsLoading = false;
let clientIsError = false;
let documentsData: unknown[] = [];
let profileData: { role: string | null } | undefined = { role: "admin" };
let updateIsPending = false;
let editEditing = false;
let editDraft: unknown = null;
let editErrors: Record<string, { message: string }> = {};

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "client-abc-123" }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/data/hooks", () => ({
  useClient: () => ({
    data: clientData,
    isLoading: clientIsLoading,
    isError: clientIsError,
    refetch: mockRefetch,
  }),
  useDocumentsByClient: () => ({ data: documentsData }),
  useAgents: () => ({ data: [{ id: "a1", full_name: "Casey Agent" }] }),
  useUpdateClient: () => ({
    mutate: mockUpdateMutate,
    isPending: updateIsPending,
  }),
  useDeleteClient: () => ({
    mutate: mockDeleteMutate,
  }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => mockToast,
}));

vi.mock("@/lib/forms/use-detail-edit", () => ({
  useDetailEdit: () => ({
    editing: editEditing,
    draft: editDraft,
    errors: editErrors,
    start: mockEditStart,
    cancel: mockEditCancel,
    save: mockEditSave,
    finish: mockEditFinish,
    setField: vi.fn(),
  }),
}));

vi.mock("@/lib/auth/roles", () => ({
  can: (role: string, action: string) => {
    if (role === "admin") return true;
    if (role === "manager" && action !== "delete") return true;
    if (role === "agent") return false;
    return false;
  },
}));

vi.mock("@/components/common/page-header", () => ({
  PageHeader: ({
    title,
    backLabel,
    backHref,
    actions,
    badges,
  }: {
    title: string;
    backLabel?: string;
    backHref?: string;
    subtitle?: React.ReactNode;
    badges?: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div>
      {backLabel && <a href={backHref}>{backLabel}</a>}
      <h1>{title}</h1>
      {badges && <div data-testid="badges">{badges}</div>}
      {actions && <div data-testid="actions">{actions}</div>}
    </div>
  ),
}));

vi.mock("@/components/common/page-states", () => ({
  PageErrorState: ({ body, onRetry }: { body: string; onRetry: () => void }) => (
    <div>
      <p>{body}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
  PageDetailLoading: () => <div data-testid="detail-loading" />,
}));

vi.mock("@/components/common/two-column-layout", () => ({
  TwoColumnLayout: ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <div>
      <div data-testid="left-col">{left}</div>
      <div data-testid="right-col">{right}</div>
    </div>
  ),
}));

vi.mock("@/components/clients/detail/client-profile-card", () => ({
  ClientProfileCard: () => <div data-testid="client-profile-card" />,
}));

vi.mock("@/components/clients/detail/client-documents-table", () => ({
  ClientDocumentsTable: () => <div data-testid="client-documents-table" />,
}));

vi.mock("@/components/clients/detail/client-draft", () => ({
  draftFromClient: (c: { first_name: string }) => ({ first_name: c.first_name }),
  draftToPatch: (d: unknown) => d,
}));

vi.mock("@/components/ui/badges", () => ({
  ClientBadge: ({ status }: { status: string }) => <span data-testid="client-badge">{status}</span>,
}));

vi.mock("@/components/ui/btn", () => ({
  Btn: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    icon?: React.ReactNode;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/client-status-picker", () => ({
  ClientStatusPicker: () => <div data-testid="status-picker" />,
}));

vi.mock("@/components/ui/modal", () => ({
  ConfirmDialog: ({
    open,
    onClose,
    onConfirm,
    title,
  }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    body?: string;
    hint?: string;
  }) =>
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock("@/lib/domain/schemas", () => ({
  clientUpdateSchema: {},
}));

import ClientDetailPage from "./page";

function makeClient(
  overrides: Partial<{
    id: string;
    first_name: string;
    last_name: string;
    status: string;
  }> = {},
) {
  return {
    id: "client-abc-123",
    first_name: "Alice",
    last_name: "Smith",
    status: "active",
    dob: "1980-04-02",
    email: "alice@acme.com",
    phone: null,
    address: null,
    agent_id: "a1",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  clientData = null;
  clientIsLoading = false;
  clientIsError = false;
  documentsData = [];
  profileData = { role: "admin" };
  updateIsPending = false;
  editEditing = false;
  editDraft = null;
  editErrors = {};
});

describe("ClientDetailPage", () => {
  it("shows loading state when client is loading", () => {
    clientIsLoading = true;
    render(<ClientDetailPage />);
    expect(screen.getByTestId("detail-loading")).toBeInTheDocument();
  });

  it("shows loading state when client data is null", () => {
    clientData = null;
    clientIsLoading = false;
    render(<ClientDetailPage />);
    expect(screen.getByTestId("detail-loading")).toBeInTheDocument();
  });

  it("shows error state when client fetch fails", () => {
    clientIsError = true;
    render(<ClientDetailPage />);
    expect(screen.getByText("Failed to load this client.")).toBeInTheDocument();
  });

  it("calls refetch when Retry is clicked in error state", () => {
    clientIsError = true;
    render(<ClientDetailPage />);
    screen.getByRole("button", { name: "Retry" }).click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders the client full name as the page title", () => {
    clientData = makeClient({ first_name: "Alice", last_name: "Smith" });
    render(<ClientDetailPage />);
    expect(screen.getByRole("heading", { name: "Alice Smith" })).toBeInTheDocument();
  });

  it("renders the Back to Clients link", () => {
    clientData = makeClient();
    render(<ClientDetailPage />);
    expect(screen.getByRole("link", { name: "Back to Clients" })).toBeInTheDocument();
  });

  it("shows the status picker for admin (can update)", () => {
    clientData = makeClient();
    profileData = { role: "admin" };
    render(<ClientDetailPage />);
    expect(screen.getByTestId("status-picker")).toBeInTheDocument();
  });

  it("shows a static badge for agent (cannot update)", () => {
    clientData = makeClient({ status: "active" });
    profileData = { role: "agent" };
    render(<ClientDetailPage />);
    expect(screen.getByTestId("client-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("status-picker")).not.toBeInTheDocument();
  });

  it("shows Edit and Delete buttons for admin", () => {
    clientData = makeClient();
    profileData = { role: "admin" };
    render(<ClientDetailPage />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows Edit but not Delete for manager (cannot delete)", () => {
    clientData = makeClient();
    profileData = { role: "manager" };
    render(<ClientDetailPage />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("hides Edit and Delete for agent", () => {
    clientData = makeClient();
    profileData = { role: "agent" };
    render(<ClientDetailPage />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("enters edit mode when Edit is clicked", async () => {
    clientData = makeClient();
    render(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(mockEditStart).toHaveBeenCalledTimes(1);
  });

  it("shows Cancel and Save buttons when in edit mode", () => {
    clientData = makeClient();
    editEditing = true;
    render(<ClientDetailPage />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls edit.cancel when Cancel is clicked in edit mode", async () => {
    clientData = makeClient();
    editEditing = true;
    render(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockEditCancel).toHaveBeenCalledTimes(1);
  });

  it("calls edit.save when Save is clicked", async () => {
    clientData = makeClient();
    editEditing = true;
    render(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mockEditSave).toHaveBeenCalledTimes(1);
  });

  it("disables Save and shows 'Saving…' while update is pending", () => {
    clientData = makeClient();
    editEditing = true;
    updateIsPending = true;
    render(<ClientDetailPage />);
    const saveBtn = screen.getByRole("button", { name: "Saving…" });
    expect(saveBtn).toBeDisabled();
  });

  it("opens confirm dialog when Delete is clicked", async () => {
    clientData = makeClient();
    render(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Delete client?" })).toBeInTheDocument();
  });

  it("calls deleteClient.mutate and navigates away on delete confirm", async () => {
    clientData = makeClient({ id: "client-abc-123" });
    render(<ClientDetailPage />);

    // Open the confirm dialog
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    // Simulate successful delete
    mockDeleteMutate.mockImplementation((_id: string, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      "client-abc-123",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockToast).toHaveBeenCalledWith("Client removed", "success");
    expect(mockPush).toHaveBeenCalledWith("/clients");
  });

  it("closes the confirm dialog without deleting when Cancel is clicked", async () => {
    clientData = makeClient();
    render(<ClientDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it("renders the profile card and documents table", () => {
    clientData = makeClient();
    render(<ClientDetailPage />);
    expect(screen.getByTestId("client-profile-card")).toBeInTheDocument();
    expect(screen.getByTestId("client-documents-table")).toBeInTheDocument();
  });

  it("toasts an error when delete fails", async () => {
    clientData = makeClient();
    render(<ClientDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    mockDeleteMutate.mockImplementation(
      (_id: string, { onError }: { onError: (e: Error) => void }) => {
        onError(new Error("DB error"));
      },
    );

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(mockToast).toHaveBeenCalledWith("Could not delete: DB error", "error");
  });
});
