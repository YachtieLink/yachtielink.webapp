-- Separate contact email from auth email
-- Users may want a different email on their CV/profile than their login email
ALTER TABLE users ADD COLUMN contact_email text;

-- Backfill: populate from existing auth email for all current users
UPDATE users SET contact_email = email WHERE contact_email IS NULL;
