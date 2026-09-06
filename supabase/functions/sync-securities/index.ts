import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SEC_URL = "https://www.sec.gov/files/company_tickers_exchange.json";

const jsonHeaders = { "Content-Type": "application/json" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function isAuthorized(req: Request, service: ReturnType<typeof createClient>) {
  const syncKey = req.headers.get("x-sync-key")?.trim() ?? "";
  if (syncKey) {
    const { data, error } = await service
      .from("internal_settings")
      .select("value_hash")
      .eq("key", "sync_securities_key_sha256")
      .maybeSingle();
    if (error) throw error;
    if (data?.value_hash) {
      const suppliedHash = await sha256Hex(syncKey);
      if (constantTimeEqual(suppliedHash, data.value_hash)) return true;
    }
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const { data: userData, error: userError } = await service.auth.getUser(token);
  if (userError || !userData.user) return false;
  const { data: profile, error: profileError } = await service
    .from("participants")
    .select("is_admin")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  return Boolean(profile?.is_admin);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Supabase service configuration is unavailable." }, 500);

  const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    if (!(await isAuthorized(req, service))) return json({ error: "Unauthorized" }, 401);

    const response = await fetch(SEC_URL, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "GoblinInvesting/1.0 caviarmy/invest-or-die"
      }
    });
    if (!response.ok) return json({ error: `SEC ticker source returned HTTP ${response.status}.` }, 502);

    const payload = await response.json();
    if (!Array.isArray(payload?.fields) || !Array.isArray(payload?.data)) {
      return json({ error: "SEC ticker source returned an unexpected format." }, 502);
    }

    const index = Object.fromEntries(payload.fields.map((field: string, position: number) => [field, position]));
    for (const required of ["cik", "name", "ticker", "exchange"]) {
      if (index[required] === undefined) return json({ error: `SEC ticker source is missing ${required}.` }, 502);
    }

    const syncedAt = new Date().toISOString();
    const lastModified = response.headers.get("last-modified");
    const sourceUpdatedAt = lastModified && !Number.isNaN(Date.parse(lastModified))
      ? new Date(lastModified).toISOString()
      : syncedAt;

    const rows = payload.data
      .map((row: unknown[]) => ({
        cik: String(row[index.cik] ?? "").trim(),
        company_name: String(row[index.name] ?? "").trim(),
        ticker: String(row[index.ticker] ?? "").trim().toUpperCase(),
        exchange: String(row[index.exchange] ?? "").trim(),
        active: true,
        source: "sec_company_tickers_exchange",
        source_updated_at: sourceUpdatedAt,
        synced_at: syncedAt
      }))
      .filter((row: { ticker: string; company_name: string; exchange: string }) =>
        row.ticker && row.company_name && row.exchange && row.exchange.toUpperCase() !== "OTC"
      );

    if (!rows.length) return json({ error: "SEC ticker source contained no eligible exchange-listed securities." }, 502);

    for (let start = 0; start < rows.length; start += 500) {
      const chunk = rows.slice(start, start + 500);
      const { error } = await service.from("securities").upsert(chunk, { onConflict: "ticker" });
      if (error) throw error;
    }

    const { error: deactivateError } = await service
      .from("securities")
      .update({ active: false })
      .eq("source", "sec_company_tickers_exchange")
      .lt("synced_at", syncedAt);
    if (deactivateError) throw deactivateError;

    return json({ ok: true, synced: rows.length, source_updated_at: sourceUpdatedAt, synced_at: syncedAt });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Ticker sync failed." }, 500);
  }
});
