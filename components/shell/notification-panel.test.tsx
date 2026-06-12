import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Notification } from "@/lib/supabase/types";
import { NotificationPanel } from "./notification-panel";

function makeNotification(over: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    user_id: "u1",
    type: "client_created",
    priority: "normal",
    title: "New client: Acme Smith",
    body: "Added as prospect.",
    entity_type: "client",
    entity_id: "client-1",
    read_at: null,
    created_at: "2026-05-29T11:59:00Z",
    ...over,
  };
}

describe("NotificationPanel", () => {
  it("renders each notification title", () => {
    const items = [
      makeNotification({ id: "a", title: "First alert" }),
      makeNotification({ id: "b", title: "Second alert" }),
    ];
    render(<NotificationPanel items={items} onItemClick={vi.fn()} onMarkAll={vi.fn()} />);
    expect(screen.getByText("First alert")).toBeInTheDocument();
    expect(screen.getByText("Second alert")).toBeInTheDocument();
  });

  it("shows an empty state when there are no notifications", () => {
    render(<NotificationPanel items={[]} onItemClick={vi.fn()} onMarkAll={vi.fn()} />);
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it("shows an error state with a retry action", async () => {
    const onRetry = vi.fn();
    render(
      <NotificationPanel
        items={[]}
        isError
        onRetry={onRetry}
        onItemClick={vi.fn()}
        onMarkAll={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onItemClick with the clicked notification", async () => {
    const onItemClick = vi.fn();
    const item = makeNotification({ id: "x", title: "Clickable" });
    render(<NotificationPanel items={[item]} onItemClick={onItemClick} onMarkAll={vi.fn()} />);
    await userEvent.click(screen.getByText("Clickable"));
    expect(onItemClick).toHaveBeenCalledWith(item);
  });

  it("enables Mark all read only when something is unread", async () => {
    const onMarkAll = vi.fn();
    const { rerender } = render(
      <NotificationPanel
        items={[makeNotification({ read_at: "2026-05-29T11:00:00Z" })]}
        onItemClick={vi.fn()}
        onMarkAll={onMarkAll}
      />,
    );
    expect(screen.getByRole("button", { name: /mark all read/i })).toBeDisabled();

    rerender(
      <NotificationPanel
        items={[makeNotification({ read_at: null })]}
        onItemClick={vi.fn()}
        onMarkAll={onMarkAll}
      />,
    );
    const markAll = screen.getByRole("button", { name: /mark all read/i });
    expect(markAll).toBeEnabled();
    await userEvent.click(markAll);
    expect(onMarkAll).toHaveBeenCalledTimes(1);
  });
});
