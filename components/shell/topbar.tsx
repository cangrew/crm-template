"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/shell/command-palette";
import { DevRoleSwitcher } from "@/components/shell/dev-role-switcher";
import { NotificationBell } from "@/components/shell/notification-bell";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { APP_NAME } from "@/lib/config/app";
import { pageTitleFor } from "@/lib/config/nav";
import type { AppRole } from "@/lib/domain/enums";

type Props = {
  userId: string;
  name: string;
  email: string;
  role: AppRole;
};

export function TopBar({ userId, name, email, role }: Props) {
  const pathname = usePathname();
  const segs = pathname.split("/").filter(Boolean);
  const isDetail = segs.length > 1;
  const rootTitle = pageTitleFor("/" + (segs[0] ?? ""));
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((cur) => !cur);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="top">
        <div className="crumbs">
          <Link href="/" className="crumb-a">
            {APP_NAME}
          </Link>
          <span className="crumb-sep">/</span>
          {isDetail ? (
            <>
              <Link href={"/" + segs[0]} className="crumb-a">
                {rootTitle}
              </Link>
              <span className="crumb-sep">/</span>
              <span className="crumb-cur">{segs.slice(1).join(" / ")}</span>
            </>
          ) : (
            <span className="crumb-cur">{pageTitleFor(pathname)}</span>
          )}
        </div>

        <button type="button" className="search-trigger" onClick={() => setCmdOpen(true)}>
          <Search size={16} />
          Search contacts, pages…
          <kbd>⌘K</kbd>
        </button>

        <div className="top-right">
          <DevRoleSwitcher currentRole={role} />
          <NotificationBell userId={userId} />
          <ProfileMenu name={name} email={email} role={role} />
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
