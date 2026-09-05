-- ==============================================================================
-- AgentReady Local — Revenue Patch Database Migration
-- Target: Supabase SQL Editor
-- ==============================================================================

-- 1. Create Leads Table
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  created_at    timestamptz not null default now(),
  source        text default 'meta_ad',
  stage         text not null default 'scanned', -- 'scanned' vs 'checkout_started'
  scanned_domain text,                           -- Business domain scanned (e.g. lakeshoreskin.com)
  scan_score    integer,                         -- AI readiness score (e.g. 34)
  utm_campaign  text,
  utm_content   text,
  fbclid        text,
  purchased     boolean not null default false,
  purchased_at  timestamptz,
  abandoned_at  timestamptz,
  nudge_step    smallint not null default 0
);

-- Add columns if table already exists
alter table public.leads add column if not exists stage text not null default 'scanned';
alter table public.leads add column if not exists scanned_domain text;
alter table public.leads add column if not exists scan_score integer;

-- Indexes for lead telemetry performance and recovery targeting
create index if not exists leads_created_idx
  on public.leads (created_at desc);

create index if not exists leads_unconverted_idx
  on public.leads (created_at desc) where purchased = false;

create index if not exists leads_checkout_stage_idx
  on public.leads (created_at desc) where stage = 'checkout_started' and purchased = false;

-- Strict Row Level Security: ZERO public policies (Service-role key server access only)
alter table public.leads enable row level security;


-- 2. Create Page Timing Telemetry Table (P1)
create table if not exists public.page_timing (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  path        text,
  ms          integer,
  depth       integer
);

create index if not exists page_timing_created_idx
  on public.page_timing (created_at desc);

-- Strict Row Level Security: ZERO public policies (Service-role key server access only)
alter table public.page_timing enable row level security;
