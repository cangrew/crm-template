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
    type: "client_created",
    priority: "normal",
    title: "New client: Acme Smith",
    body: "Added as prospect.",
    entity_type: "client",
    entity_id: "client-7",
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
    listValue = [makeNotification({ id: "x", entity_type: "client", entity_id: "client-7" })];
    render(<NotificationBell userId="u1" />);

    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await userEvent.click(screen.getByText("New client: Acme Smith"));

    expect(markReadMutate).toHaveBeenCalledWith("x");
    expect(push).toHaveBeenCalledWith("/clients/client-7");
  });

  it("routes high-priority notifications to the linked entity page", async () => {
    listValue = [
      makeNotification({
        id: "p",
        type: "policy_lapsed",
        priority: "high",
        entity_type: "policy",
        entity_id: "42",
        title: "Policy lapsed: Acme Smith",
      }),
    ];
    render(<NotificationBell userId="u1" />);

    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await userEvent.click(screen.getByText("Policy lapsed: Acme Smith"));

    expect(push).toHaveBeenCalledWith("/policies/42");
  });
});
