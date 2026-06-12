import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UploadDocumentModal } from "./upload-document-modal";

const { uploadMutate, createMutate } = vi.hoisted(() => ({
  uploadMutate: vi.fn(),
  createMutate: vi.fn(),
}));

vi.mock("@/lib/data/hooks", () => ({
  useClients: () => ({ data: [{ id: "c1", first_name: "Ada", last_name: "Lovelace" }] }),
  useCurrentProfile: () => ({ data: { id: "u1" } }),
  useSignedUpload: () => ({ mutateAsync: uploadMutate, isPending: false }),
  useCreateDocument: () => ({ mutateAsync: createMutate, isPending: false }),
}));

function renderModal(ui: ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function pickFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["data"], "agreement.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

describe("UploadDocumentModal", () => {
  beforeEach(() => {
    uploadMutate.mockReset().mockResolvedValue({ path: "x" });
    createMutate.mockReset().mockResolvedValue({ id: "d1" });
  });

  it("keeps Upload disabled until a file is chosen", () => {
    renderModal(<UploadDocumentModal open onClose={() => {}} />);
    const upload = screen.getByRole("button", { name: /upload/i });
    expect(upload).toBeDisabled();

    pickFile();
    expect(upload).toBeEnabled();
  });

  it("uploads a standalone document under the general prefix", async () => {
    const onClose = vi.fn();
    renderModal(<UploadDocumentModal open onClose={onClose} />);

    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());

    expect(uploadMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/^general\/contract-\d+-agreement\.pdf$/),
      }),
    );
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: null,
        kind: "contract",
        uploaded_by: "u1",
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("records the linked client and scopes the path to it", async () => {
    renderModal(<UploadDocumentModal open onClose={() => {}} />);

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "c1" } });
    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());

    expect(uploadMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/^c1\/contract-\d+-agreement\.pdf$/),
      }),
    );
    expect(createMutate).toHaveBeenCalledWith(expect.objectContaining({ client_id: "c1" }));
  });
});
