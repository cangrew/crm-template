import { PendingAccessCard } from "@/components/account/pending-access-card";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

// Reads the session (cookies) to tailor the message, which makes this route
// dynamic — it is never statically prerendered, so the build does not try to
// construct a Supabase client without env vars.
export default async function PendingAccessPage() {
  const supabase = await createClient();
  // This is the only destination for roleless users, so fail open to a generic
  // pending state rather than letting a lookup error break the route.
  let profile = null;
  try {
    profile = await getCurrentProfile(supabase);
  } catch {
    profile = null;
  }
  return <PendingAccessCard deactivated={profile ? !profile.is_active : false} />;
}
