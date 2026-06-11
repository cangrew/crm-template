"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { Tone } from "@/lib/design/tones";
import { cn } from "@/lib/utils";

export type StatusOption<T extends string> = {
  value: T;
  label: string;
  tone: Tone;
  disabled?: boolean;
};

type MenuPos = {
  left: number;
  top?: number;
  bottom?: number;
  minWidth: number;
};

type Props<T extends string> = {
  value: T;
  options: StatusOption<T>[];
  ariaLabel: string;
  menuLabel?: string;
  pending?: boolean;
  onSelect: (next: T) => void;
};

const MENU_GAP = 4;
const MIN_MENU_WIDTH = 200;
const ESTIMATED_MENU_HEIGHT = 300;

/**
 * Inline status picker styled as a pill badge. The open list is a custom
 * popover (the real status badges, with a check on the active one) rendered in
 * a body portal so it escapes table overflow clipping rather than relying on
 * the browser's native, unstyleable select list.
 */
export function StatusPicker<T extends string>({
  value,
  options,
  ariaLabel,
  menuLabel = "Set status",
  pending = false,
  onSelect,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value);
  const currentTone = current?.tone ?? "t-slate";
  const currentLabel = current?.label ?? value;

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? ESTIMATED_MENU_HEIGHT;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + MENU_GAP && rect.top > spaceBelow;
    setPos({
      left: rect.left,
      top: openUp ? undefined : rect.bottom + MENU_GAP,
      bottom: openUp ? window.innerHeight - rect.top + MENU_GAP : undefined,
      minWidth: Math.max(rect.width, MIN_MENU_WIDTH),
    });
  }, []);

  // Position on open and keep the popover anchored as the page or table scrolls.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  // Move focus into the active option when the menu opens.
  useEffect(() => {
    if (!open) return;
    const selected = menuRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"]');
    const first = menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)");
    (selected ?? first)?.focus();
  }, [open]);

  // Light dismiss: outside click and Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: T) {
    setOpen(false);
    triggerRef.current?.focus();
    if (next !== value) onSelect(next);
  }

  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    );
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  return (
    <div
      className="status-pick"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(badgeVariants({ tone: currentTone }), "badge-pick status-pick-trigger")}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bdot" aria-hidden />
        <span className="badge-pick-lbl">{currentLabel}</span>
        <ChevronDown size={11} className="badge-pick-chev" aria-hidden />
      </button>
      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="menu status-pick-menu"
            role="listbox"
            aria-label={ariaLabel}
            onKeyDown={onMenuKeyDown}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              minWidth: pos.minWidth,
            }}
          >
            {menuLabel && <div className="menu-lbl">{menuLabel}</div>}
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected}
                  className={"menu-item status-pick-item" + (selected ? " is-active" : "")}
                  disabled={o.disabled}
                  onClick={() => choose(o.value)}
                >
                  <Badge tone={o.tone}>
                    <span className="bdot" aria-hidden />
                    {o.label}
                  </Badge>
                  {selected && <Check className="check" aria-hidden />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
