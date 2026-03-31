-- Migration: Add skills_summary and interests_summary to users table
-- These store the narrative blurbs that accompany the structured skills/hobbies chips

alter table users add column if not exists skills_summary text;
alter table users add column if not exists interests_summary text;

-- Soft recommendation at 1000/500, hard limit at 1500/750
alter table users add constraint skills_summary_length check (char_length(skills_summary) <= 1500);
alter table users add constraint interests_summary_length check (char_length(interests_summary) <= 750);
