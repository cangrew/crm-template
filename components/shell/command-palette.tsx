"use client";

import { BookUser, Search, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContactBadge } from "@/components/ui/badges";
import { canAccessPath } from "@/lib/auth/route-access";
import { NAV_GROUPS } from "@/lib/config/nav";
import { useContacts, useCurrentProfile } from "@/lib/data/hooks";
import type { ContactStatus } from "@/lib/domain/enums";

type PageItem = {
  kind: "page";
  href: string;
  label: string;
  icon: LucideIcon;
};

const PAGES: PageItem[] = NAV_GROUPS.flatMap((g) =>
  g.items.map<PageItem>((it) => ({
    kind: "page",
    href: it.href,
    label: it.label,
    icon: it.icon,
  })),
);

type ContactItem = {
  kind: "contact";
  href: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  status: ContactStatus;
};

type Item = PageItem | ContactItem;

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <PaletteContent onClose={onClose} />;
}

function PaletteContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileQ = useCurrentProfile();
  const role = profileQ.data?.role ?? null;
  const contactsQ = useContacts();

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, []);

  const groups = useMemo(() => {
    const q = query.toLowerCase();
    const pageMatches: Item[] = PAGES.filter(
      (p) => canAccessPath(p.href, role) && (!q || p.label.toLowerCase().includes(q)),
    );

    const contactMatches: Item[] = (contactsQ.data ?? [])
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.company ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map<ContactItem>((c) => ({
        kind: "contact",
        href: `/contacts/${c.id}`,
        label: c.name,
        sub: `${c.company ?? "—"} · ${c.email ?? "—"}`,
        icon: BookUser,
        status: c.status,
      }));

    const out: { title: string; items: Item[] }[] = [];
    if (pageMatches.length) out.push({ title: "Pages", items: pageMatches });
    if (contactMatches.length) out.push({ title: "Contacts", items: contactMatches });
    return out;
  }, [query, role, contactsQ.data]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const clampedSel = Math.min(sel, Math.max(flat.length - 1, 0));

  function pick(item: Item) {
    onClose();
    router.push(item.href);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((cur) => Math.min(cur + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((cur) => Math.max(cur - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[clampedSel];
      if (item) pick(item);
    }
  }

  let idx = -1;
  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cmdk">
        <div className="cmdk-in">
          <Search size={19} />
          <input
            ref={inputRef}
            value={query}
            placeholder="Search contacts, pages…"
            onChange={(e) => {
              setQuery(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKey}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="cmdk-list">
          {flat.length === 0 && (
            <div className="text-ink-500 p-7 text-center text-[13.5px]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {groups.map((g) => (
            <div key={g.title}>
              <div className="cmdk-sec">{g.title}</div>
              {g.items.map((it) => {
                idx++;
                const i = idx;
                const Icon = it.icon;
                return (
                  <div
                    key={i}
                    className={"cmdk-item" + (i === clampedSel ? " is-active" : "")}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => pick(it)}
                  >
                    <span className="ci-icon">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <div className="ci-name">{it.label}</div>
                      {"sub" in it && <div className="ci-sub">{it.sub}</div>}
                    </span>
                    {it.kind === "contact" && (
                      <span className="ci-meta">
                        <ContactBadge status={it.status} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmdk-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
