-- Migration 001: Extensions
-- Enable required PostgreSQL extensions

create extension if not exists "pg_trgm";        -- trigram search for yacht/role typeahead
create extension if not exists "unaccent";        -- accent-insensitive search
create extension if not exists "pgcrypto";        -- gen_random_bytes for tokens
create extension if not exists "uuid-ossp";       -- uuid_generate_v4 (fallback)

-- Internal schema for admin/moderation tables
create schema if not exists internal;
