-- Sprint 11b: Allow endorsement recipients to update is_pinned
-- The existing RLS policy only allows endorsers (auth.uid() = endorser_id) to update.
-- Recipients need to toggle is_pinned on their own endorsements.

create policy "endorsements: recipient pin"
  on public.endorsements for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);
