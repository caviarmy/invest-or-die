# Goblin Investing Backend

Goblin Investing uses GitHub Pages for the public site and Supabase for authentication, Postgres, Row Level Security, Storage, scheduled reference-data sync, and server-authoritative Called It actions.

Participants interact only with Goblin Investing. They do not need Supabase, GitHub, SEC, or market-data-provider accounts.

## Browser connection

The browser uses only the Supabase Project URL and publishable key in `index.html`. These values identify the public Supabase API and are intended for browser use. Authorization is enforced with Supabase Auth and Row Level Security.

Never commit a Supabase secret key, service-role key, market-data API key, or scheduler credential to GitHub.

## Called It authority model

The browser can read the public dashboard, active challenges, game settings, ticker reference data, and The Receipts.

All Called It mutations now go through the `called-it` Edge Function: create, price check, submit, cancel, owner metadata edit, admin edit, review, and cooldown reset. The browser has no direct authenticated UPDATE grant on `called_it_plays`.

### Owner-metadata cutover complete

The production frontend routes owner metadata edits to the authenticated `owner_edit` action in the `called-it` Edge Function. That action can change only `reason`, `portfolio_action`, `action_amount`, and `amount_committed` on an active challenge after validating the authenticated actor and the action/direction combination.

It cannot change ticker, direction, prices, targets, qualification, review state, status, cooldown, or any other authoritative challenge term.

The previous compatibility path has been retired after the visual redesign was merged to `main`:

- `edit_own_called_it_metadata` has been dropped;
- the authenticated owner UPDATE RLS policy has been removed;
- authenticated UPDATE grants on `called_it_plays` have been revoked.

The Edge Function is authoritative for:

- authentication and participant ownership;
- slot availability and review cooldowns;
- ticker validation;
- market-price retrieval;
- starting price and timestamp;
- prediction percentages and target calculations;
- challenge expiration and flat claim windows;
- current-price checks;
- qualification;
- fresh price validation when submitting for review;
- immutable qualifying price/time;
- owner metadata edits;
- review status and cooldown;
- admin approval/rejection and cooldown reset.

## Tables

### `participants`

Participant roster and authorization profile.

Important fields:

- `user_id`
- `display_name`
- `sort_order`
- `active`
- `is_admin`

### `called_it_plays`

Stores the full challenge lifecycle. Legacy v1 columns remain nullable for historical compatibility, while v2 uses:

- `owner_id`
- `slot_number`
- `ticker`
- `company_name`
- `exchange`
- `reference_price`
- `reference_price_at`
- `direction`: `up`, `down`, or `flat`
- `target_percent`
- `target_price`
- `target_low`
- `target_high`
- `reason`
- `portfolio_action`: `buy`, `hold`, `sell`, or `not_buying`
- `action_amount`
- `expires_at`
- `claim_until`
- `last_checked_price`
- `last_checked_at`
- `qualifying_price`
- `qualifying_price_at`
- `submitted_at`
- `lock_until`
- `reviewed_at`
- `reviewed_by`
- `review_note`
- `status`: `active`, `under_review`, `approved`, `rejected`, `cancelled`, or `expired`

At most one `active` or `under_review` challenge may occupy a participant slot.

### `game_settings`

Called It difficulty and timing live in data so they can be changed without a frontend deploy.

Current defaults:

- Goes Up: `15%`
- Goes Down: `15%`
- Finish About the Same: `±3%`
- Challenge length: `28 days`
- Review cooldown: `7 days`
- Flat claim window: `7 days`
- Approved payout: `$5`

### `securities`

Reference data for ticker autocomplete. It contains ticker, company name, exchange, CIK, active status, source timestamps, and sync metadata.

This is not a price source.

### `market_quote_cache`

Short-lived internal quote cache. It is not readable or writable by browser roles.

### `results_history`

The Receipts. Called It rows are inserted when a challenge is submitted and updated when it is approved or rejected. The Called It leaderboard counts Approved rows only.

### `weekly_winner`

Current and historical Win the Week data remains separate from Called It.

## Edge Functions

### `called-it`

Authenticated participant/admin challenge API.

Actions:

- `preview`
- `create`
- `check`
- `submit`
- `cancel`
- `owner_edit`
- `admin_edit`
- `review`
- `reset_cooldown`

`owner_edit` was added during the visual-redesign cutover and is now the only participant owner-metadata mutation path.

The platform `verify_jwt` switch remains disabled because the function performs mandatory bearer-token validation itself through `getActor()` before any action executes.

The function deliberately fails closed if a market quote cannot be obtained.

### `sync-securities`

Fetches the SEC `company_tickers_exchange.json` reference file and refreshes `securities`.

The scheduled invocation uses a private random key stored in Supabase Vault. An authenticated admin can also invoke the function manually.

The production database schedules this sync daily.

## Market-data provider

The `called-it` function currently uses Twelve Data through a provider adapter. The API key stays server-side.

The function first looks for an Edge Function environment secret named:

`TWELVE_DATA_API_KEY`

If that is not set, it can read a Supabase Vault secret named:

`twelve_data_api_key`

Example owner-only SQL for adding the Vault secret:

```sql
select vault.create_secret('YOUR_TWELVE_DATA_API_KEY', 'twelve_data_api_key');
```

Do not put the actual key in this repository or in browser JavaScript.

Provider licensing and quote entitlements should be reviewed before the site is used beyond the family/educational context.

## Storage

The public bucket `weekly-charts` stores the current Win the Week chart. The admin UI overwrites `current.<extension>` rather than retaining an image archive.

## Authorization

Row Level Security is enabled on exposed public tables.

- signed-out visitors can read active participants, current challenges, game settings, securities, weekly winner data, and The Receipts;
- signed-out visitors cannot mutate data;
- authenticated participants can read their own challenge history in addition to the public challenge state;
- authenticated participants have no direct UPDATE grant on `called_it_plays`;
- owner metadata edits are validated by the server-authoritative `owner_edit` action;
- authoritative challenge writes are validated by the Edge Function against the authenticated user;
- admins can manage all participant challenges through the same server-authoritative API;
- only admins can change game settings and weekly winner data;
- internal quote cache, scheduler settings, and secrets are not exposed to browser roles.

Frontend controls are convenience only. Authorization is enforced by the backend.
