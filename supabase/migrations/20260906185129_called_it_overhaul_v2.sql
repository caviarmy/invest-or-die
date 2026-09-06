create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists pg_net;
create extension if not exists pg_cron;

alter table public.called_it_plays drop constraint if exists called_it_plays_status_check;
alter table public.called_it_plays alter column amount_committed drop not null;
alter table public.called_it_plays alter column call_price drop not null;
alter table public.called_it_plays alter column target_price drop not null;
alter table public.called_it_plays alter column call_date drop not null;
alter table public.called_it_plays drop constraint if exists called_it_plays_check;
alter table public.called_it_plays alter column expires_at type timestamptz using expires_at::timestamptz;

alter table public.called_it_plays
  add column if not exists exchange text,
  add column if not exists reference_price numeric(20,6),
  add column if not exists reference_price_at timestamptz,
  add column if not exists direction text,
  add column if not exists target_percent numeric(8,4),
  add column if not exists target_low numeric(20,6),
  add column if not exists target_high numeric(20,6),
  add column if not exists reason text,
  add column if not exists portfolio_action text,
  add column if not exists action_amount numeric(12,2),
  add column if not exists claim_until timestamptz,
  add column if not exists last_checked_price numeric(20,6),
  add column if not exists last_checked_at timestamptz,
  add column if not exists qualifying_price numeric(20,6),
  add column if not exists qualifying_price_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists lock_until timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_note text;

alter table public.called_it_plays
  add constraint called_it_plays_status_check check (status in ('active','under_review','approved','rejected','cancelled','expired','called_it')),
  add constraint called_it_plays_direction_check check (direction is null or direction in ('up','down','flat')),
  add constraint called_it_plays_reference_price_check check (reference_price is null or reference_price > 0),
  add constraint called_it_plays_target_percent_check check (target_percent is null or target_percent > 0),
  add constraint called_it_plays_target_low_check check (target_low is null or target_low > 0),
  add constraint called_it_plays_target_high_check check (target_high is null or target_high > 0),
  add constraint called_it_plays_reason_check check (reason is null or char_length(reason) <= 4000),
  add constraint called_it_plays_portfolio_action_check check (portfolio_action is null or portfolio_action in ('buy','hold','sell','not_buying')),
  add constraint called_it_plays_action_amount_check check (
    portfolio_action is null
    or (portfolio_action = 'not_buying' and action_amount is null)
    or (portfolio_action in ('buy','hold','sell') and action_amount >= 5)
  ),
  add constraint called_it_plays_review_note_check check (review_note is null or char_length(review_note) <= 2000),
  add constraint called_it_plays_target_range_check check (target_low is null or target_high is null or target_low <= target_high);

update public.called_it_plays
set reference_price = coalesce(reference_price, call_price),
    reference_price_at = coalesce(reference_price_at, call_date::timestamptz),
    reason = coalesce(reason, nullif(concat_ws(E'\n', research_note, thesis), '')),
    direction = coalesce(direction, 'up'),
    target_percent = coalesce(target_percent, 10),
    action_amount = coalesce(action_amount, amount_committed),
    portfolio_action = coalesce(portfolio_action, case when amount_committed is not null then 'hold' else 'not_buying' end)
where reference_price is null or direction is null or target_percent is null or portfolio_action is null;

update public.called_it_plays
set status = 'approved',
    submitted_at = coalesce(submitted_at, updated_at),
    reviewed_at = coalesce(reviewed_at, updated_at),
    qualifying_price = coalesce(qualifying_price, target_price),
    qualifying_price_at = coalesce(qualifying_price_at, updated_at)
where status = 'called_it';

create unique index if not exists called_it_one_active_slot_per_owner_v2
  on public.called_it_plays(owner_id, slot_number)
  where status in ('active','under_review');
drop index if exists public.called_it_one_active_slot_per_owner;
create index if not exists called_it_owner_status_idx on public.called_it_plays(owner_id, status);
create index if not exists called_it_ticker_status_idx on public.called_it_plays(ticker, status);
create index if not exists called_it_lock_idx on public.called_it_plays(owner_id, slot_number, lock_until desc);

alter table public.game_settings
  add column if not exists called_it_up_percent numeric(8,4) not null default 15,
  add column if not exists called_it_down_percent numeric(8,4) not null default 15,
  add column if not exists called_it_flat_percent numeric(8,4) not null default 3,
  add column if not exists called_it_duration_days integer not null default 28,
  add column if not exists called_it_review_lock_days integer not null default 7,
  add column if not exists called_it_flat_claim_days integer not null default 7,
  add column if not exists called_it_payout numeric(8,2) not null default 5;

alter table public.game_settings
  add constraint game_settings_called_it_up_percent_check check (called_it_up_percent > 0 and called_it_up_percent <= 100),
  add constraint game_settings_called_it_down_percent_check check (called_it_down_percent > 0 and called_it_down_percent < 100),
  add constraint game_settings_called_it_flat_percent_check check (called_it_flat_percent > 0 and called_it_flat_percent <= 25),
  add constraint game_settings_called_it_duration_days_check check (called_it_duration_days between 1 and 365),
  add constraint game_settings_called_it_review_lock_days_check check (called_it_review_lock_days between 0 and 90),
  add constraint game_settings_called_it_flat_claim_days_check check (called_it_flat_claim_days between 1 and 90),
  add constraint game_settings_called_it_payout_check check (called_it_payout >= 0 and called_it_payout <= 1000);

alter table public.results_history
  add column if not exists direction text,
  add column if not exists starting_price numeric(20,6),
  add column if not exists target_low numeric(20,6),
  add column if not exists target_high numeric(20,6),
  add column if not exists qualifying_price numeric(20,6),
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists status text,
  add column if not exists review_note text;

alter table public.results_history
  add constraint results_history_direction_check check (direction is null or direction in ('up','down','flat')),
  add constraint results_history_status_check check (status is null or status in ('under_review','approved','rejected'));

create table if not exists public.securities (
  ticker text primary key,
  company_name text not null,
  exchange text,
  cik text,
  active boolean not null default true,
  source text not null default 'sec_company_tickers_exchange',
  source_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  constraint securities_ticker_check check (char_length(ticker) between 1 and 12),
  constraint securities_company_name_check check (char_length(company_name) between 1 and 200)
);
alter table public.securities enable row level security;
drop policy if exists "public can read securities" on public.securities;
create policy "public can read securities" on public.securities for select to anon, authenticated using (active = true);
grant select on public.securities to anon, authenticated;
grant all on public.securities to service_role;
create index if not exists securities_ticker_upper_idx on public.securities ((upper(ticker)));
create index if not exists securities_company_trgm_idx on public.securities using gin (company_name gin_trgm_ops);

create table if not exists public.market_quote_cache (
  ticker text primary key,
  price numeric(20,6) not null check (price > 0),
  price_at timestamptz not null,
  provider text not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.market_quote_cache enable row level security;
revoke all on public.market_quote_cache from anon, authenticated;
grant all on public.market_quote_cache to service_role;
create index if not exists market_quote_cache_expiry_idx on public.market_quote_cache(expires_at);

create table if not exists public.internal_settings (
  key text primary key,
  value_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.internal_settings enable row level security;
revoke all on public.internal_settings from anon, authenticated;
grant select, insert, update, delete on public.internal_settings to service_role;

create or replace function public.edge_get_secret(secret_name text)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = secret_name
  order by created_at desc
  limit 1
$$;
revoke all on function public.edge_get_secret(text) from public, anon, authenticated;
grant execute on function public.edge_get_secret(text) to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists called_it_set_updated_at on public.called_it_plays;
create trigger called_it_set_updated_at before update on public.called_it_plays for each row execute function public.set_updated_at();

create or replace function public.record_called_it_history()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_game_week integer;
  resolved_name text;
  payout numeric;
begin
  if new.status in ('under_review','approved','rejected') and old.status is distinct from new.status then
    select current_week, called_it_payout
      into current_game_week, payout
    from public.game_settings
    where id = 'main';

    select display_name into resolved_name
    from public.participants
    where user_id = new.owner_id;

    insert into public.results_history (
      event_type, participant_user_id, participant_name, event_date, week_number,
      ticker, call_price, target_price, target_low, target_high, direction,
      starting_price, qualifying_price, submitted_at, reviewed_at, status, review_note,
      reward_amount, source_table, source_id
    ) values (
      'called_it', new.owner_id, coalesce(resolved_name, 'Participant'),
      coalesce(new.submitted_at::date, new.reviewed_at::date, current_date), current_game_week,
      new.ticker, coalesce(new.reference_price, new.call_price), new.target_price, new.target_low, new.target_high, new.direction,
      coalesce(new.reference_price, new.call_price), new.qualifying_price, new.submitted_at, new.reviewed_at, new.status, new.review_note,
      case when new.status = 'approved' then coalesce(payout, 5) else 0 end,
      'called_it_plays', new.id
    )
    on conflict (source_table, source_id) do update set
      participant_user_id = excluded.participant_user_id,
      participant_name = excluded.participant_name,
      event_date = excluded.event_date,
      week_number = excluded.week_number,
      ticker = excluded.ticker,
      call_price = excluded.call_price,
      target_price = excluded.target_price,
      target_low = excluded.target_low,
      target_high = excluded.target_high,
      direction = excluded.direction,
      starting_price = excluded.starting_price,
      qualifying_price = excluded.qualifying_price,
      submitted_at = excluded.submitted_at,
      reviewed_at = excluded.reviewed_at,
      status = excluded.status,
      review_note = excluded.review_note,
      reward_amount = excluded.reward_amount;
  end if;
  return new;
end;
$$;

drop trigger if exists called_it_history_trigger on public.called_it_plays;
create trigger called_it_history_trigger after update on public.called_it_plays for each row execute function public.record_called_it_history();

drop policy if exists "admin can insert any play" on public.called_it_plays;
drop policy if exists "admin can update any play" on public.called_it_plays;
drop policy if exists "authenticated can read active plays and own history" on public.called_it_plays;
drop policy if exists "participants can delete own plays" on public.called_it_plays;
drop policy if exists "participants can insert own plays" on public.called_it_plays;
drop policy if exists "participants can update own plays" on public.called_it_plays;
drop policy if exists "public can read active plays" on public.called_it_plays;
create policy "public can read current plays" on public.called_it_plays
  for select to anon using (status in ('active','under_review'));
create policy "authenticated can read current own or admin plays" on public.called_it_plays
  for select to authenticated using (
    status in ('active','under_review')
    or owner_id = (select auth.uid())
    or exists (select 1 from public.participants p where p.user_id = (select auth.uid()) and p.is_admin = true)
  );
revoke insert, update, delete on public.called_it_plays from anon, authenticated;
grant select on public.called_it_plays to anon, authenticated;
grant all on public.called_it_plays to service_role;

grant select on public.results_history to anon, authenticated;

do $$
declare
  v_secret text;
begin
  if not exists (select 1 from public.internal_settings where key = 'sync_securities_key_sha256') then
    v_secret := encode(gen_random_bytes(32), 'hex');
    insert into public.internal_settings(key, value_hash)
    values ('sync_securities_key_sha256', encode(digest(v_secret, 'sha256'), 'hex'));
    perform vault.create_secret(v_secret, 'sync_securities_key');
  end if;
end;
$$;

select cron.unschedule(jobid) from cron.job where jobname = 'sync-securities-daily';
select cron.schedule(
  'sync-securities-daily',
  '17 11 * * *',
  $$
  select net.http_post(
    url := 'https://zdxuaphrtedzzsiheslg.supabase.co/functions/v1/sync-securities',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-key', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_securities_key' order by created_at desc limit 1)
    ),
    body := '{}'::jsonb
  );
  $$
);