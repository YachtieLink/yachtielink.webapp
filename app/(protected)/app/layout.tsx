import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/nav/BottomTabBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
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

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-surface)]">
      {/* Page content — padded so it clears the tab bar */}
      <main className="flex-1 pb-tab-bar">{children}</main>

      {/* Fixed bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}
