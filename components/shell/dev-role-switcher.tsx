"use client";

import { Check, ChevronDown, FlaskConical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { DEV_PASSWORD, DEV_USERS, writeStoredDevRole } from "@/lib/dev/dev-users";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/client";

const IS_DEV =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "1";

type Props = {
  currentRole: AppRole;
};

export function DevRoleSwitcher({ currentRole }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<AppRole | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
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

  const switchRole = useCallback(
    async (next: AppRole) => {
      if (next === currentRole || pending) return;
      setPending(next);
      const supabase = createClient();
      const { email } = DEV_USERS[next];
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password: DEV_PASSWORD });
      if (error) {
        setPending(null);
        const isMissing = /invalid login|user not found|email not confirmed/i.test(error.message);
        toast(
          isMissing
            ? `${APP_ROLE_LABELS[next]} user not in this database. Run: pnpm db:reset:sample`
            : `Could not switch: ${error.message}`,
          "error",
        );
        await supabase.auth.signInWithPassword({
          email: DEV_USERS[currentRole].email,
          password: DEV_PASSWORD,
        });
        return;
      }
      writeStoredDevRole(next);
      window.location.reload();
    },
    [currentRole, pending, toast],
  );

  if (!IS_DEV) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className="dev-pill"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Dev role switcher (development only)"
      >
        <FlaskConical size={13} />
        <span>DEV · {APP_ROLE_LABELS[currentRole]}</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <div role="menu" className="menu top-[38px] right-0 min-w-[220px]">
          <div className="menu-lbl">View as</div>
          {(Object.keys(DEV_USERS) as AppRole[]).map((role) => {
            const selected = role === currentRole;
            return (
              <button
                key={role}
                type="button"
                role="menuitem"
                className={"menu-item" + (selected ? " is-active" : "")}
                onClick={() => switchRole(role)}
                disabled={pending !== null}
              >
                <span>{APP_ROLE_LABELS[role]}</span>
                {selected && <Check size={14} className="check" />}
              </button>
            );
          })}
          <div className="menu-sep" />
          <div className="text-ink-500 px-2.5 pt-1.5 pb-1 text-[11px]">
            Signs you in as that role&apos;s seeded user. Local dev only.
          </div>
        </div>
      )}
    </div>
  );
}
