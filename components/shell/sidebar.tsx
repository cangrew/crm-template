"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/domain/enums";
import { canAccessPath } from "@/lib/auth/route-access";
import { APP_NAME } from "@/lib/config/app";
import { NAV_GROUPS } from "@/lib/config/nav";

export function Sidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();

  return (
    <aside className="side">
      <div className="side-logo">
        <span className="font-display font-700 text-[19px] tracking-tight text-white">
          {APP_NAME}
        </span>
      </div>
      <nav className="side-nav" aria-label="Primary">
        {NAV_GROUPS.map((grp) => {
          const visible = grp.items.filter((it) => canAccessPath(it.href, role));
          if (!visible.length) return null;
          return (
            <div key={grp.group}>
              <div className="side-group-label">{grp.group}</div>
              {visible.map((it) => {
                const active =
                  it.href === "/"
                    ? pathname === "/"
                    : pathname === it.href || pathname.startsWith(it.href + "/");
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={"nav-item" + (active ? " active" : "")}
                  >
                    <Icon />
                    <span className="nav-label">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
