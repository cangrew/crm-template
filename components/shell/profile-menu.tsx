"use client";

import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/domain/enums";

type Props = {
  name: string;
  email: string;
  role: AppRole;
};

export function ProfileMenu({ name, email, role }: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not sign out";
      toast(msg, "error");
      setSigningOut(false);
    }
  }, [router, toast]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className="um bg-transparent text-left text-inherit [font:inherit]"
        title={email}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} />
        <span className="um-text text-left">
          <div className="um-name">{name}</div>
          <div className="um-role">{APP_ROLE_LABELS[role]}</div>
        </span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div role="menu" className="menu top-[50px] right-0">
          <div className="px-2.5 pt-2 pb-2.5">
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-ink-500 text-xs break-all">{email}</div>
          </div>
          <div className="menu-sep" />
          <Link
            href="/account?tab=profile"
            className="menu-item"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <User size={16} />
            My profile
          </Link>
          <Link
            href="/account?tab=preferences"
            className="menu-item"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <Settings size={16} />
            Preferences
          </Link>
          <div className="menu-sep" />
          <button
            type="button"
            className="menu-item danger"
            onClick={handleSignOut}
            disabled={signingOut}
            role="menuitem"
          >
            <LogOut size={16} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
