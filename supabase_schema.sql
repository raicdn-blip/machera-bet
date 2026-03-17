-- ============================================================
-- MACHERA BET — Supabase Schema
-- Ejecutar en: Supabase > SQL Editor > New Query > Run
-- ============================================================

-- Extension para UUIDs
create extension if not exists "uuid-ossp";

-- ─── LIMPIAR (si ya existe) ──────────────────────────────
drop table if exists bets cascade;
drop table if exists events cascade;
drop table if exists monthly_periods cascade;
drop table if exists tournaments cascade;
drop table if exists users cascade;

-- ─── USERS ───────────────────────────────────────────────
create table users (
  id           uuid default uuid_generate_v4() primary key,
  username     text unique not null,
  password     text not null,
  display_name text not null,
  avatar       text default '🦁',
  is_admin     boolean default false,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- ─── TOURNAMENTS ─────────────────────────────────────────
create table tournaments (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  sport      text not null,
  season     text,
  created_at timestamptz default now()
);

-- ─── EVENTS ──────────────────────────────────────────────
create table events (
  id            uuid default uuid_generate_v4() primary key,
  sport         text not null,
  home          text not null,
  away          text not null,
  event_date    date not null,
  event_time    time not null,
  close_at      timestamptz not null,  -- 5 min antes del inicio
  status        text default 'upcoming'
                  check (status in ('upcoming','live','closed','finished')),
  result_home   numeric,
  result_away   numeric,
  note          text default '',
  tournament_id uuid references tournaments(id) on delete set null,
  event_month   int not null,
  event_year    int not null,
  created_at    timestamptz default now()
);

-- ─── BETS ────────────────────────────────────────────────
create table bets (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid not null references users(id)   on delete cascade,
  event_id   uuid not null references events(id)  on delete cascade,
  home_pred  numeric not null,
  away_pred  numeric not null,
  points     int,                              -- null = pendiente
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, event_id)
);

-- ─── MONTHLY PERIODS ─────────────────────────────────────
create table monthly_periods (
  id           uuid default uuid_generate_v4() primary key,
  period_month int not null,
  period_year  int not null,
  player_count int default 0,
  pot_amount   int default 0,               -- en CLP
  winner1_id   uuid references users(id),
  winner2_id   uuid references users(id),
  winner3_id   uuid references users(id),
  winner1_pts  int default 0,
  winner2_pts  int default 0,
  winner3_pts  int default 0,
  prize1       int default 0,               -- 50% del pozo
  prize2       int default 0,               -- 30% del pozo
  prize3       int default 0,               -- 20% del pozo
  is_closed    boolean default false,
  closed_at    timestamptz,
  unique(period_month, period_year)
);

-- ─── DESHABILITAR RLS (app privada/interna) ───────────────
alter table users            disable row level security;
alter table tournaments      disable row level security;
alter table events           disable row level security;
alter table bets             disable row level security;
alter table monthly_periods  disable row level security;

-- ─── ADMIN POR DEFECTO ────────────────────────────────────
-- ⚠️ Cambia la contraseña después de hacer el primer login
insert into users (username, password, display_name, avatar, is_admin, is_active)
values ('admin', 'machera2024', 'Admin', '⚙️', true, true);

-- ─── ÍNDICES PARA PERFORMANCE ────────────────────────────
create index idx_events_status   on events(status);
create index idx_events_month    on events(event_month, event_year);
create index idx_bets_user       on bets(user_id);
create index idx_bets_event      on bets(event_id);
create index idx_bets_points     on bets(points);

-- ─── VERIFICAR ────────────────────────────────────────────
select 'Schema creado correctamente ✅' as resultado;
select username, display_name, is_admin from users;
