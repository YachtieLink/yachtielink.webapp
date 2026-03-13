/**
 * /u/:handle — Public profile page (Sprint 6)
 * Server-rendered, SEO-optimised.
 */
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  return {
    title: `${handle} | YachtieLink`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, display_name, primary_role, bio, profile_photo_url")
    .eq("handle", handle.toLowerCase())
    .single();

  if (!user) notFound();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {user.display_name ?? user.full_name}
          </h1>
          {user.primary_role && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {user.primary_role}
            </p>
          )}
        </div>
        {/* Full profile — Sprint 6 */}
        <p className="mt-8 text-center text-sm text-[var(--color-text-tertiary)]">
          Full profile coming in Sprint 6.
        </p>
      </div>
    </div>
  );
}
