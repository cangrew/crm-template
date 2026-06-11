"use client";

import { Bell, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AccountSummaryCard, type AccountProfile } from "@/components/account/account-summary-card";
import { PreferencesTab } from "@/components/account/preferences-tab";
import { ProfileTab } from "@/components/account/profile-tab";
import { PageHeader } from "@/components/common/page-header";
import { TabBar, type TabDef } from "@/components/common/tab-bar";
import { useCurrentProfile } from "@/lib/data/hooks";

type Tab = "profile" | "preferences";

const TABS: readonly TabDef<Tab>[] = [
  { key: "profile", label: "Profile", icon: <User size={15} /> },
  { key: "preferences", label: "Preferences", icon: <Bell size={15} /> },
];

const STUB_PROFILE: AccountProfile = {
  id: "00000000-0000-0000-0000-000000000000",
  full_name: "Design QA",
  email: "design-qa@example.com",
  role: "admin",
};

export default function AccountPage() {
  const profileQ = useCurrentProfile();
  const data = profileQ.data;
  // Only provisioned users reach this page (the guard sends roleless ones to
  // /pending), so a missing role falls back to the design-QA stub.
  const profile: AccountProfile =
    data && data.role
      ? { id: data.id, full_name: data.full_name, email: data.email, role: data.role }
      : STUB_PROFILE;
  const searchParams = useSearchParams();
  const urlTab: Tab = searchParams.get("tab") === "preferences" ? "preferences" : "profile";
  const [tab, setTab] = useState<Tab>(urlTab);
  const [syncedFrom, setSyncedFrom] = useState<Tab>(urlTab);
  if (urlTab !== syncedFrom) {
    setSyncedFrom(urlTab);
    setTab(urlTab);
  }

  return (
    <div className="mx-auto max-w-[1080px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="My Account"
        subtitle="Manage your profile, sign-in, and notifications"
        actions={<TabBar tabs={TABS} active={tab} onChange={setTab} />}
      />

      <AccountSummaryCard profile={profile} />

      {tab === "profile" ? (
        <ProfileTab profile={profile} />
      ) : (
        <PreferencesTab userId={profile.id} role={profile.role} />
      )}
    </div>
  );
}
