"use client";

import { useEffect, useRef } from "react";
import { DEV_FALLBACK_ROLE, DEV_PASSWORD, DEV_USERS, readStoredDevRole } from "@/lib/dev/dev-users";
import { createClient } from "@/lib/supabase/client";

export function DevAutoSignin() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;

      const preferred = readStoredDevRole();
      const first = await supabase.auth.signInWithPassword({
        email: DEV_USERS[preferred].email,
        password: DEV_PASSWORD,
      });
      if (!first.error) {
        window.location.reload();
        return;
      }

      if (preferred !== DEV_FALLBACK_ROLE) {
        const fallback = await supabase.auth.signInWithPassword({
          email: DEV_USERS[DEV_FALLBACK_ROLE].email,
          password: DEV_PASSWORD,
        });
        if (!fallback.error) {
          window.location.reload();
          return;
        }
        console.warn("[dev-auto-signin] fallback admin sign-in failed:", fallback.error.message);
        return;
      }

      console.warn("[dev-auto-signin] sign-in failed:", first.error.message);
    })();
  }, []);

  return null;
}
