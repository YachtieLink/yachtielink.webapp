import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { SidebarNav } from "@/components/nav/SidebarNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/welcome");
  }

  // Gate: must complete onboarding before accessing the main app
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  // Badge count is now fetched client-side via useNetworkBadge hook
  // so the app shell renders instantly without waiting for that query.

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-surface)]">
      {/* Fixed sidebar navigation — desktop only */}
      <SidebarNav />

      {/* Page content — padded so it clears the tab bar on mobile, sidebar on desktop */}
      <main className="flex-1 pb-tab-bar md:pb-0 md:pl-16">
        <div className="mx-auto max-w-2xl">
          {children}
        </div>
      </main>

      {/* Fixed bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
