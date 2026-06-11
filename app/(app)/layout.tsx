import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DevAutoSignin } from "@/components/shell/dev-auto-signin";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/topbar";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

// Bypass the login redirect for local design QA / E2E (render the shell with a
// stub Admin profile when there is no real session). isAuthBypassEnabled
// hard-disables this in production, so a leaked env var can't expose the app.
const BYPASS = isAuthBypassEnabled();

const STUB_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "design-qa@example.com",
  full_name: "Design QA",
  role: "admin",
  is_active: true,
  created_at: new Date().toISOString(),
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const realProfile = await getCurrentProfile(supabase);

  if (!realProfile && !BYPASS) {
    redirect("/login");
  }

  const profile = realProfile ?? STUB_PROFILE;

  // Defense in depth: the proxy guard already keeps roleless / deactivated users
  // out of the app shell, but enforce it here too for direct server renders.
  // This also narrows profile.role to a concrete AppRole for the shell props.
  if (!profile.role || !profile.is_active) {
    redirect("/pending");
  }
  const displayName = profile.full_name || profile.email;
  const needsDevSignin = BYPASS && !realProfile;

  return (
    <div className="app">
      <Sidebar role={profile.role} />
      <TopBar userId={profile.id} name={displayName} email={profile.email} role={profile.role} />
      <main className="main">{children}</main>
      {needsDevSignin && <DevAutoSignin />}
    </div>
  );
}
