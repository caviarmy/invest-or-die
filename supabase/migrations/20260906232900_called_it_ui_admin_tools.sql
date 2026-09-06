alter table public.called_it_plays
  drop constraint if exists called_it_direction_action_match;

alter table public.called_it_plays
  add constraint called_it_direction_action_match
  check (
    direction is null
    or portfolio_action is null
    or (direction = 'up' and portfolio_action in ('buy','hold'))
    or (direction = 'down' and portfolio_action in ('sell','not_buying'))
    or (direction = 'flat' and portfolio_action in ('hold','not_buying'))
  );

create or replace function public.edit_own_called_it_metadata(
  challenge_id uuid,
  new_reason text,
  new_portfolio_action text,
  new_action_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_play public.called_it_plays%rowtype;
  v_reason text := btrim(coalesce(new_reason, ''));
  v_action text := lower(btrim(coalesce(new_portfolio_action, '')));
  v_amount numeric := new_action_amount;
  v_is_admin boolean := false;
begin
  if v_user_id is null then
    raise exception 'Sign in to edit a Called It challenge.';
  end if;

  select coalesce(p.is_admin, false)
    into v_is_admin
  from public.participants p
  where p.user_id = v_user_id;

  select * into v_play
  from public.called_it_plays
  where id = challenge_id;

  if not found then
    raise exception 'Challenge not found.';
  end if;

  if v_play.status <> 'active' then
    raise exception 'Only an active challenge can be edited.';
  end if;

  if v_play.owner_id <> v_user_id and not v_is_admin then
    raise exception 'You can only edit your own challenge.';
  end if;

  if v_reason = '' then
    raise exception 'Explain why you think this will happen.';
  end if;

  if length(v_reason) > 4000 then
    raise exception 'Your explanation must be 4,000 characters or less.';
  end if;

  if not (
    (v_play.direction = 'up' and v_action in ('buy','hold'))
    or (v_play.direction = 'down' and v_action in ('sell','not_buying'))
    or (v_play.direction = 'flat' and v_action in ('hold','not_buying'))
  ) then
    raise exception 'That action does not match this prediction.';
  end if;

  if v_action = 'not_buying' then
    v_amount := null;
  elsif v_amount is null or v_amount < 5 or v_amount > 1000000 then
    raise exception 'Buy, Hold, and Sell require an amount of at least $5.';
  end if;

  update public.called_it_plays
  set reason = v_reason,
      portfolio_action = v_action,
      action_amount = v_amount,
      amount_committed = v_amount,
      updated_at = now()
  where id = challenge_id
  returning * into v_play;

  return to_jsonb(v_play);
end;
$$;

revoke all on function public.edit_own_called_it_metadata(uuid,text,text,numeric) from public, anon;
grant execute on function public.edit_own_called_it_metadata(uuid,text,text,numeric) to authenticated;

drop policy if exists "admin can delete results history" on public.results_history;
create policy "admin can delete results history"
on public.results_history
for delete
to authenticated
using (
  exists (
    select 1
    from public.participants p
    where p.user_id = (select auth.uid())
      and p.is_admin = true
  )
);

grant delete on public.results_history to authenticated;
