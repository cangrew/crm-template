import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Notification } from "@/lib/supabase/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const realtimeSpy = vi.fn();
vi.mock("@/lib/data/use-notifications-realtime", () => ({
  useNotificationsRealtime: (userId: string) => realtimeSpy(userId),
}));

const markReadMutate = vi.fn();
const markAllMutate = vi.fn();
let unreadValue = 0;
let listValue: Notification[] = [];

vi.mock("@/lib/data/hooks", () => ({
  useUnreadCount: () => ({ data: unreadValue }),
  useNotifications: () => ({ data: listValue, isLoading: false, isError: false, refetch: vi.fn() }),
  useMarkNotificationRead: () => ({ mutate: markReadMutate }),
  useMarkAllNotificationsRead: () => ({ mutate: markAllMutate }),
}));

import { NotificationBell } from "./notification-bell";

function makeNotification(over: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    user_id: "u1",
    type: "contact_created",
    priority: "normal",
    title: "New contact: Acme",
    body: "Acme Co — added as lead.",
    entity_type: "contact",
    entity_id: "contact-7",
    read_at: null,
    created_at: "2026-05-29T11:59:00Z",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  unreadValue = 0;
  listValue = [];
});

describe("NotificationBell", () => {
  it("subscribes to realtime for the given user", () => {
    render(<NotificationBell userId="user-9" />);
    expect(realtimeSpy).toHaveBeenCalledWith("user-9");
  });

  it("shows the unread count as a badge", () => {
    unreadValue = 3;
    render(<NotificationBell userId="u1" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 9+", () => {
    unreadValue = 25;
    render(<NotificationBell userId="u1" />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("opens the panel and navigates on item click, marking it read", async () => {
    listValue = [makeNotification({ id: "x", entity_type: "contact", entity_id: "contact-7" })];
    render(<NotificationBell userId="u1" />);

    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await userEvent.click(screen.getByText("New contact: Acme"));

    expect(markReadMutate).toHaveBeenCalledWith("x");
    expect(push).toHaveBeenCalledWith("/contacts/contact-7");
  });

  it("routes high-priority notifications to the contact detail page", async () => {
    listValue = [
      makeNotification({
        id: "p",
        type: "contact_at_risk",
        priority: "high",
        entity_id: "42",
        title: "Contact at risk: Acme",
      }),
    ];
    render(<NotificationBell userId="u1" />);

    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await userEvent.click(screen.getByText("Contact at risk: Acme"));

    expect(push).toHaveBeenCalledWith("/contacts/42");
  });
});
