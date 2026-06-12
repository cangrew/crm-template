"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Message shown to an authenticated user who has no usable role — either
 * pending a role assignment or deactivated. Rendered by the server `/pending`
 * page, which reads `deactivated` from the user's own profile.
 */
export function PendingAccessCard({ deactivated }: { deactivated: boolean }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
      router.push("/login");
    } catch {
      // Re-enable the button so the user can retry rather than being stuck.
      setSigningOut(false);
    }
  }

  return (
    <div className="bg-bg grid min-h-screen place-items-center p-10">
      <div className="animate-fade-up border-border bg-bg w-full max-w-[480px] rounded-[20px] border px-11 py-10 text-center shadow-[var(--shadow-card)]">
        <span className="text-brand-700 mb-[22px] inline-flex items-center gap-2 rounded-full border border-[rgba(46,82,144,.28)] bg-[rgba(46,82,144,.12)] px-[13px] py-1.5 text-[12.5px] font-semibold">
          <span className="bg-brand-500 h-[7px] w-[7px] rounded-full" />
          {deactivated ? "Access disabled" : "Account pending"}
        </span>

        <h1 className="mb-2.5 text-2xl">
          {deactivated ? "Your access has been disabled" : "Your account isn’t set up yet"}
        </h1>

        <p className="text-ink-500 mb-7 text-[14.5px] leading-[1.6]">
          {deactivated ? (
            <>
              An administrator has disabled this account. If you think this is a mistake, contact
              your administrator to have it re-enabled.
            </>
          ) : (
            <>
              You’re signed in with Microsoft Entra ID, but an administrator still needs to assign
              you a role before you can access Operations. You’ll get in as soon as that’s done.
            </>
          )}
        </p>

        <button type="button" className="btn btn-outline" disabled={signingOut} onClick={signOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>

        <p className="text-ink-400 mt-6 text-[12.5px] leading-[1.6]">
          Need help? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
