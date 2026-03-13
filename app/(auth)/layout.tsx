import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in — go to app
  if (user) {
    redirect("/app/profile");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface)]">
      {children}
    </div>
  );
}
