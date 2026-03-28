-- Sprint 11c: Add profile_template column for bento grid template selection
-- Pro users can choose between 'classic' and 'bold' bento layouts

ALTER TABLE users ADD COLUMN profile_template text NOT NULL DEFAULT 'classic'
  CHECK (profile_template IN ('classic', 'bold'));
