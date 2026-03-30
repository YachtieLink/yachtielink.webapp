# Database Migration Push Protocol

How to push migrations to the remote Supabase database. Follow these steps every time.

## Standard Push

```bash
npx supabase db push --yes
```

If this works, you're done. If it fails, read on.

## Common Failure: "local migration files to be inserted before the last migration"

This means you have local migration files with timestamps earlier than the most recent remote migration. The CLI refuses to push them out of order.

**Fix:** Use `--include-all`:

```bash
npx supabase db push --include-all --yes
```

## Common Failure: "column already exists" or "relation already exists"

This means a migration was applied manually (via the Supabase SQL editor or a previous session) but not tracked in `supabase_migrations.schema_migrations`. The CLI tries to re-apply it.

**Fix:** Make the migration idempotent:

```sql
-- Instead of:
ALTER TABLE users ADD COLUMN foo text NOT NULL DEFAULT 'bar'
  CHECK (foo IN ('bar', 'baz'));

-- Use:
ALTER TABLE users ADD COLUMN IF NOT EXISTS foo text NOT NULL DEFAULT 'bar';
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_foo_check
    CHECK (foo IN ('bar', 'baz'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- For policies:
DO $$ BEGIN
  CREATE POLICY "policy_name" ON public.table_name ...;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- For functions:
CREATE OR REPLACE FUNCTION ...  -- already idempotent
```

After making migrations idempotent, re-run `npx supabase db push --include-all --yes`.

## Common Failure: "duplicate key value violates unique constraint schema_migrations_pkey"

This happens when you used `supabase migration repair --status applied` to mark a migration, then the CLI tries to insert the same key during push.

**Fix:** Revert the repair first:

```bash
npx supabase migration repair --status reverted <timestamp>
```

Then push. The CLI will insert the key itself after successfully applying the idempotent SQL.

## Common Failure: iCloud duplicate files

iCloud sometimes creates `filename 2.sql` duplicates. These confuse the CLI.

**Fix:** Delete them:

```bash
ls supabase/migrations/ | grep " 2\."
rm "supabase/migrations/<duplicate filename>"
```

## Checking Migration Status

```bash
# See what's applied vs pending
npx supabase migration list

# Verify the remote DB has the right schema
npx supabase db diff --linked
```

## Quick Reference

```bash
# Standard push
npx supabase db push --yes

# Push with out-of-order locals
npx supabase db push --include-all --yes

# Mark a migration as already applied (use sparingly)
npx supabase migration repair --status applied <timestamp>

# Revert a repair
npx supabase migration repair --status reverted <timestamp>

# List migration status
npx supabase migration list
```

## Rules

1. **Always make migrations idempotent** — use `IF NOT EXISTS`, `CREATE OR REPLACE`, and `EXCEPTION WHEN duplicate_object` patterns
2. **Never manually run SQL in the Supabase dashboard** without also tracking it via `supabase migration repair`
3. **Check for iCloud duplicates** before pushing if you get unexpected file lists
4. **Test the push in a single command** — don't chain repairs + push. Make migrations safe to re-run instead.
