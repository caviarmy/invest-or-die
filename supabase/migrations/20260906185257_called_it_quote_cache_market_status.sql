alter table public.market_quote_cache add column if not exists market_status text;
alter table public.market_quote_cache add constraint market_quote_cache_market_status_check check (market_status is null or market_status in ('open','closed','unknown'));
