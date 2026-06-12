"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config/app";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithMicrosoft() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "email openid profile",
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="bg-bg grid min-h-screen grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid place-items-center p-10">
        <div className="animate-fade-up bg-bg border-border w-full max-w-[460px] rounded-[20px] border px-11 py-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,.06),0_24px_48px_-8px_rgba(0,0,0,.12)]">
          <div className="font-display text-ink-900 mb-4 text-center text-[30px] font-bold tracking-tight">
            {APP_NAME}
          </div>
          <h1 className="mb-2 text-[28px]">Sign in to your workspace</h1>
          <p className="text-ink-500 mb-8 text-[14.5px] leading-[1.6]">{APP_DESCRIPTION}</p>

          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-[11px] rounded-[var(--radius-md)] border border-[#fecaca] bg-[#fef2f2] px-[15px] py-[13px] text-[13px] leading-[1.5] text-[#b91c1c]"
            >
              <div>
                <b className="mb-0.5 block">Could not sign in</b>
                {error}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={signInWithMicrosoft}
            disabled={loading}
            className={cn(
              "border-border-strong bg-bg text-ink-900 flex h-[50px] w-full items-center justify-center gap-[11px] rounded-[var(--radius-md)] border text-[15px] font-semibold shadow-[var(--shadow-card)] transition-all duration-[180ms]",
              loading ? "cursor-wait" : "cursor-pointer",
            )}
          >
            {loading ? (
              "Signing in…"
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                  <rect x="2" y="2" width="9.2" height="9.2" fill="#f25022" />
                  <rect x="12.8" y="2" width="9.2" height="9.2" fill="#7fba00" />
                  <rect x="2" y="12.8" width="9.2" height="9.2" fill="#00a4ef" />
                  <rect x="12.8" y="12.8" width="9.2" height="9.2" fill="#ffb900" />
                </svg>
                Sign in with Microsoft
              </>
            )}
          </button>

          <div className="text-ink-400 my-[26px] flex items-center gap-2 text-xs">
            <div className="bg-border h-px flex-1" />
            SECURED BY MICROSOFT ENTRA ID
            <div className="bg-border h-px flex-1" />
          </div>
          <p className="text-ink-400 text-[12.5px] leading-[1.6]">
            Trouble signing in? Contact your administrator.
          </p>
        </div>
      </div>

      <div className="bg-ink-900 relative grid place-items-center overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11,18,32,.92),rgba(11,18,32,.55))]" />
        <div className="relative max-w-[440px] p-12 text-white">
          <span className="text-brand-400 mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(255,82,0,.3)] bg-[rgba(255,82,0,.15)] px-[13px] py-1.5 text-[12.5px] font-semibold">
            <span className="bg-brand-500 h-[7px] w-[7px] rounded-full" />
            Internal operations platform
          </span>
          <div className="font-display text-[40px] leading-[1.08] font-bold tracking-[-0.02em]">
            Every relationship,
            <br />
            in one place.{" "}
            <span className="text-brand-500">
              One workspace,
              <br />
              one source of truth.
            </span>
          </div>
          <p className="mt-5 text-[15px] leading-[1.6] text-white/70">
            Clients, documents and the people who manage them — tracked end to end with role-based
            access for the whole team.
          </p>
        </div>
      </div>
    </div>
  );
}
