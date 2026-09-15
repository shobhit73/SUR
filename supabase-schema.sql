-- Sur — Supabase schema (Phase 0: profiles, likes, matches, chat, simulated calls)
-- Run once in: Supabase Dashboard -> SQL Editor -> New query -> paste all -> Run.
-- Safe to re-run: tables use "if not exists". If a policy/publication line errors
-- because it already exists, that's fine — ignore that one line and continue.

-- 1. Profiles — one row per REAL person who has completed the quiz.
--    Demo/example profiles stay as static data in the app itself, not in this table.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age int not null,
  gender text not null check (gender in ('W','M','N')),
  seek text[] not null,
  city text default '',
  intent text not null check (intent in ('M','L','O')),
  bio text default '',
  vector numeric[] not null,
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "profiles_select_authenticated" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert_self" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on profiles for update using (auth.uid() = id);

-- 2. Likes — directional "I said hello to them". Ids are text so a demo
--    profile's id (e.g. "npc:5") and a real auth uid can both appear here.
create table if not exists likes (
  from_id text not null,
  to_id text not null,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);
alter table likes enable row level security;
create policy "likes_select_participant" on likes for select using (auth.uid()::text = from_id or auth.uid()::text = to_id);
create policy "likes_insert_self" on likes for insert with check (auth.uid()::text = from_id);

-- 3. Matches — canonical pair, always stored with the lexicographically smaller id first.
create table if not exists matches (
  a text not null,
  b text not null,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
alter table matches enable row level security;
create policy "matches_select_participant" on matches for select using (auth.uid()::text = a or auth.uid()::text = b);
create policy "matches_insert_participant" on matches for insert with check (auth.uid()::text = a or auth.uid()::text = b);

-- 4. Messages — chat inside one match.
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  match_a text not null,
  match_b text not null,
  from_id text,
  kind text not null default 'text' check (kind in ('text','system')),
  body text not null,
  created_at timestamptz not null default now(),
  foreign key (match_a, match_b) references matches(a, b) on delete cascade
);
alter table messages enable row level security;
create policy "messages_select_participant" on messages for select using (auth.uid()::text = match_a or auth.uid()::text = match_b);
create policy "messages_insert_participant" on messages for insert with check (auth.uid()::text = match_a or auth.uid()::text = match_b);

-- 5. Calls — one live call-state row per match (ringing / active / ended).
create table if not exists calls (
  match_a text not null,
  match_b text not null,
  status text not null default 'ended' check (status in ('ringing','active','ended')),
  mode text check (mode in ('voice','video')),
  by_id text,
  started_at timestamptz,
  connected_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  muted jsonb not null default '{}'::jsonb,
  camera_off jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (match_a, match_b),
  foreign key (match_a, match_b) references matches(a, b) on delete cascade
);
alter table calls enable row level security;
create policy "calls_select_participant" on calls for select using (auth.uid()::text = match_a or auth.uid()::text = match_b);
create policy "calls_insert_participant" on calls for insert with check (auth.uid()::text = match_a or auth.uid()::text = match_b);
create policy "calls_update_participant" on calls for update using (auth.uid()::text = match_a or auth.uid()::text = match_b);

-- 6. Turn on realtime for the tables the app listens to live.
alter publication supabase_realtime add table likes;
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table calls;
