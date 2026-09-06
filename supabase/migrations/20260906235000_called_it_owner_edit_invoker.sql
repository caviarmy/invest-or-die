alter function public.edit_own_called_it_metadata(uuid,text,text,numeric) security invoker;

revoke update on public.called_it_plays from authenticated;
grant update (reason, portfolio_action, action_amount, amount_committed, updated_at) on public.called_it_plays to authenticated;

drop policy if exists "owners can edit active challenge metadata" on public.called_it_plays;
create policy "owners can edit active challenge metadata"
on public.called_it_plays
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and status = 'active'
)
with check (
  owner_id = (select auth.uid())
  and status = 'active'
);
