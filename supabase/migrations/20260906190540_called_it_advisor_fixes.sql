alter extension pg_trgm set schema extensions;
create index if not exists called_it_reviewed_by_idx on public.called_it_plays(reviewed_by);
create index if not exists results_history_participant_user_id_idx on public.results_history(participant_user_id);
create index if not exists weekly_winner_winner_user_id_idx on public.weekly_winner(winner_user_id);
