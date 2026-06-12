import {
  BookUser,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for primary navigation. The sidebar renders these
 * groups (filtered per role via canAccessPath), the topbar derives page titles
 * from them, and the command palette lists them as jump targets. Add an entry
 * here when you add a page; restricted areas also need a branch in
 * lib/auth/route-access.ts.
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = { group: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/policies", label: "Policies", icon: ShieldCheck },
      { href: "/clients", label: "Clients", icon: BookUser },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    group: "Agency",
    items: [
      { href: "/agents", label: "Agents", icon: UserRound },
      { href: "/agencies", label: "Agencies", icon: Building2 },
      { href: "/carriers", label: "Carriers", icon: Landmark },
    ],
  },
  {
    group: "Admin",
    items: [{ href: "/settings/users", label: "Users", icon: Users }],
  },
];

/** Pages that exist outside the sidebar, or whose topbar title differs. */
const TITLE_OVERRIDES: Record<string, string> = {
  "/settings/users": "User Management",
  "/account": "My Account",
};

const NAV_TITLES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((it) => [it.href, it.label])),
);

/** Resolve the topbar title for a pathname (root segment fallback). */
export function pageTitleFor(pathname: string): string {
  const exact = TITLE_OVERRIDES[pathname] ?? NAV_TITLES[pathname];
  if (exact) return exact;
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return "Dashboard";
  const root = "/" + segs[0];
  return TITLE_OVERRIDES[root] ?? NAV_TITLES[root] ?? segs[0];
}
