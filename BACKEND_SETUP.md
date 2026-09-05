# Goblin Investing Backend Setup

The public site is deployable without a backend, but sign-in, editing, weekly-winner updates, and chart uploads stay disabled until the backend is connected.

Participants never need a Supabase, GitHub, or other vendor account. The backend is infrastructure only.

## Owner setup required

Create one Supabase project and provide ChatGPT only these two browser-safe values:

- Project URL
- Publishable key

Do not provide or commit the `service_role` key.

Once those two values exist, add them to the homepage as these two meta tags inside `<head>`:

- `goblin-supabase-url`
- `goblin-supabase-publishable-key`

The current JavaScript automatically detects those tags and enables the live backend.

## Tables

### participants

This table is a small addition to the original architecture. The architecture defines authenticated user IDs but does not define how the public dashboard turns those IDs into participant display names or how the app identifies the admin account.

Fields:

- `user_id` UUID, linked to the authenticated user
- `display_name` text
- `sort_order` integer
- `active` boolean
- `is_admin` boolean

Create three active participant rows. The admin can be a fourth row with `active = false` and `is_admin = true`, or one participant can also be the admin.

### called_it_plays

Fields from the architecture:

- `id` UUID primary key
- `owner_id` UUID
- `slot_number` integer, only 1 or 2
- `ticker` text
- `company_name` text, nullable
- `amount_committed` numeric
- `call_price` numeric
- `target_price` numeric
- `call_date` date
- `expires_at` date
- `research_note` text, nullable
- `thesis` text, nullable
- `status` text: `active`, `called_it`, `cancelled`, or `expired`
- `created_at` timestamp
- `updated_at` timestamp

The database should prevent more than one active record for the same `owner_id` + `slot_number` while still allowing old cancelled/expired records to remain as history.

### weekly_winner

Fields from the architecture:

- `id` UUID primary key
- `week_start` date
- `week_end` date
- `winner_name` text
- `return_percent` numeric
- `chart_url` text, nullable
- `updated_at` timestamp

## Storage

Create a public bucket named `weekly-charts`.

The admin UI overwrites a single object named `current.<extension>` instead of building a weekly image archive.

## Required authorization behavior

Enable Row Level Security on all exposed tables and configure database grants/policies so that:

- signed-out visitors can read active participant names, active Called It! plays, and the current weekly winner
- signed-out visitors cannot insert, update, or delete anything
- signed-in participants can create and modify only rows whose `owner_id` matches their authenticated user ID
- a participant cannot change a play to another `owner_id`
- participants cannot edit weekly-winner data
- only the admin account can insert/update weekly-winner data
- only the admin account can upload/replace the object in `weekly-charts`
- only the admin can change participant/profile rows

Frontend button visibility is convenience only. The database/storage policies must enforce all authorization even if someone manually changes browser requests.

## Auth

Create accounts for the three participants and the admin. Open public registration is not needed.

The site uses email + password sign-in directly inside Goblin Investing. Participants do not visit a Supabase-hosted login page.

## Final connection step

After the project, tables, policies, storage bucket, and accounts exist, provide ChatGPT the Project URL and Publishable key. The repository can then be connected without adding any privileged secret to GitHub.
