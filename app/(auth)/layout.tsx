import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
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
    // Auth service unavailable — let the auth page render normally.
    // User can attempt to sign in; if Supabase is down, signIn will show an error.
    user = null;
  }

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
