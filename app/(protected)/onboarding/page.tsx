import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wizard } from "@/components/onboarding/Wizard";

// This page depends on the session — always render dynamically
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout handles this, but guard here for static-analysis safety
  if (!user) redirect("/welcome");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, display_name, handle, departments, primary_role")
    .eq("id", user!.id)
    .single();

  return (
    <Wizard
      userId={user.id}
      initialData={{
        full_name: profile?.full_name ?? null,
        display_name: profile?.display_name ?? null,
        handle: profile?.handle ?? null,
        departments: (profile?.departments as string[] | null) ?? null,
        primary_role: profile?.primary_role ?? null,
      }}
    />
  );
}
