import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { AuthStateListener } from "@/components/providers/AuthStateListener";
import { TourProvider } from "@/components/tour/TourProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth service unavailable — middleware should have caught this,
    // but belt-and-suspenders: treat as unauthenticated.
    user = null;
  }

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
      <AuthStateListener />

      {/* Fixed sidebar navigation — desktop only */}
      <SidebarNav />

      {/* Page content — padded so it clears the tab bar on mobile, sidebar on desktop */}
      <main className="flex-1 pb-20 md:pb-0 md:pl-16">
        <div className="mx-auto max-w-2xl px-4 md:px-6">
          <TourProvider>
            {children}
          </TourProvider>
        </div>
      </main>

      {/* Fixed bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
