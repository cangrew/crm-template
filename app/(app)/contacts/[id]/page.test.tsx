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

let contactData: unknown = null;
let contactIsLoading = false;
let contactIsError = false;
let documentsData: unknown[] = [];
let profileData: { role: string | null } | undefined = { role: "admin" };
let updateIsPending = false;
let editEditing = false;
let editDraft: unknown = null;
let editErrors: Record<string, { message: string }> = {};

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "contact-abc-123" }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/data/hooks", () => ({
  useContact: () => ({
    data: contactData,
    isLoading: contactIsLoading,
    isError: contactIsError,
    refetch: mockRefetch,
  }),
  useDocumentsByContact: () => ({ data: documentsData }),
  useUpdateContact: () => ({
    mutate: mockUpdateMutate,
    isPending: updateIsPending,
  }),
  useDeleteContact: () => ({
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
    if (role === "member") return false;
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

vi.mock("@/components/contacts/detail/contact-profile-card", () => ({
  ContactProfileCard: () => <div data-testid="contact-profile-card" />,
}));

vi.mock("@/components/contacts/detail/contact-documents-table", () => ({
  ContactDocumentsTable: () => <div data-testid="contact-documents-table" />,
}));

vi.mock("@/components/contacts/detail/contact-draft", () => ({
  draftFromContact: (c: { name: string }) => ({ name: c.name }),
  draftToPatch: (d: unknown) => d,
}));

vi.mock("@/components/ui/badges", () => ({
  ContactBadge: ({ status }: { status: string }) => (
    <span data-testid="contact-badge">{status}</span>
  ),
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

vi.mock("@/components/ui/contact-status-picker", () => ({
  ContactStatusPicker: () => <div data-testid="status-picker" />,
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
  contactUpdateSchema: {},
}));

import ContactDetailPage from "./page";

function makeContact(
  overrides: Partial<{
    id: string;
    name: string;
    company: string | null;
    status: string;
  }> = {},
) {
  return {
    id: "contact-abc-123",
    name: "Alice Smith",
    company: "Acme Corp",
    status: "active",
    email: "alice@acme.com",
    phone: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  contactData = null;
  contactIsLoading = false;
  contactIsError = false;
  documentsData = [];
  profileData = { role: "admin" };
  updateIsPending = false;
  editEditing = false;
  editDraft = null;
  editErrors = {};
});

describe("ContactDetailPage", () => {
  it("shows loading state when contact is loading", () => {
    contactIsLoading = true;
    render(<ContactDetailPage />);
    expect(screen.getByTestId("detail-loading")).toBeInTheDocument();
  });

  it("shows loading state when contact data is null", () => {
    contactData = null;
    contactIsLoading = false;
    render(<ContactDetailPage />);
    expect(screen.getByTestId("detail-loading")).toBeInTheDocument();
  });

  it("shows error state when contact fetch fails", () => {
    contactIsError = true;
    render(<ContactDetailPage />);
    expect(screen.getByText("Failed to load this contact.")).toBeInTheDocument();
  });

  it("calls refetch when Retry is clicked in error state", () => {
    contactIsError = true;
    render(<ContactDetailPage />);
    screen.getByRole("button", { name: "Retry" }).click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders the contact name as the page title", () => {
    contactData = makeContact({ name: "Alice Smith" });
    render(<ContactDetailPage />);
    expect(screen.getByRole("heading", { name: "Alice Smith" })).toBeInTheDocument();
  });

  it("renders the Back to Contacts link", () => {
    contactData = makeContact();
    render(<ContactDetailPage />);
    expect(screen.getByRole("link", { name: "Back to Contacts" })).toBeInTheDocument();
  });

  it("shows the status picker for admin (can update)", () => {
    contactData = makeContact();
    profileData = { role: "admin" };
    render(<ContactDetailPage />);
    expect(screen.getByTestId("status-picker")).toBeInTheDocument();
  });

  it("shows a static badge for member (cannot update)", () => {
    contactData = makeContact({ status: "active" });
    profileData = { role: "member" };
    render(<ContactDetailPage />);
    expect(screen.getByTestId("contact-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("status-picker")).not.toBeInTheDocument();
  });

  it("shows Edit and Delete buttons for admin", () => {
    contactData = makeContact();
    profileData = { role: "admin" };
    render(<ContactDetailPage />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows Edit but not Delete for manager (cannot delete)", () => {
    contactData = makeContact();
    profileData = { role: "manager" };
    render(<ContactDetailPage />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("hides Edit and Delete for member", () => {
    contactData = makeContact();
    profileData = { role: "member" };
    render(<ContactDetailPage />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("enters edit mode when Edit is clicked", async () => {
    contactData = makeContact();
    render(<ContactDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(mockEditStart).toHaveBeenCalledTimes(1);
  });

  it("shows Cancel and Save buttons when in edit mode", () => {
    contactData = makeContact();
    editEditing = true;
    render(<ContactDetailPage />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls edit.cancel when Cancel is clicked in edit mode", async () => {
    contactData = makeContact();
    editEditing = true;
    render(<ContactDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockEditCancel).toHaveBeenCalledTimes(1);
  });

  it("calls edit.save when Save is clicked", async () => {
    contactData = makeContact();
    editEditing = true;
    render(<ContactDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mockEditSave).toHaveBeenCalledTimes(1);
  });

  it("disables Save and shows 'Saving…' while update is pending", () => {
    contactData = makeContact();
    editEditing = true;
    updateIsPending = true;
    render(<ContactDetailPage />);
    const saveBtn = screen.getByRole("button", { name: "Saving…" });
    expect(saveBtn).toBeDisabled();
  });

  it("opens confirm dialog when Delete is clicked", async () => {
    contactData = makeContact();
    render(<ContactDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Delete contact?" })).toBeInTheDocument();
  });

  it("calls deleteContact.mutate and navigates away on delete confirm", async () => {
    contactData = makeContact({ id: "contact-abc-123" });
    render(<ContactDetailPage />);

    // Open the confirm dialog
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    // Simulate successful delete
    mockDeleteMutate.mockImplementation((_id: string, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      "contact-abc-123",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockToast).toHaveBeenCalledWith("Contact removed", "success");
    expect(mockPush).toHaveBeenCalledWith("/contacts");
  });

  it("closes the confirm dialog without deleting when Cancel is clicked", async () => {
    contactData = makeContact();
    render(<ContactDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it("renders the profile card and documents table", () => {
    contactData = makeContact();
    render(<ContactDetailPage />);
    expect(screen.getByTestId("contact-profile-card")).toBeInTheDocument();
    expect(screen.getByTestId("contact-documents-table")).toBeInTheDocument();
  });

  it("toasts an error when delete fails", async () => {
    contactData = makeContact();
    render(<ContactDetailPage />);

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
