import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const QUOTE_CACHE_SECONDS = 45;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

class HttpError extends Error {
  status: number;
  details: Record<string, unknown> | null;
  constructor(status: number, message: string, details: Record<string, unknown> | null = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function normalizeTicker(value: unknown) {
  const ticker = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9.\-]{1,12}$/.test(ticker)) throw new HttpError(400, "Choose a valid ticker.");
  return ticker;
}

function normalizeDirection(value: unknown) {
  const direction = String(value ?? "").trim().toLowerCase();
  if (!["up", "down", "flat"].includes(direction)) throw new HttpError(400, "Choose Go Up, Go Down, or Finish About the Same.");
  return direction;
}

function normalizeReason(value: unknown) {
  const reason = String(value ?? "").trim();
  if (!reason) throw new HttpError(400, "Explain why you think this will happen.");
  if (reason.length > 4000) throw new HttpError(400, "Your explanation must be 4,000 characters or less.");
  return reason;
}

function normalizePortfolioAction(value: unknown, amountValue: unknown) {
  const action = String(value ?? "").trim().toLowerCase();
  if (!["buy", "hold", "sell", "not_buying"].includes(action)) throw new HttpError(400, "Choose what you are doing with the investment.");
  if (action === "not_buying") return { portfolio_action: action, action_amount: null };
  const amount = Number(amountValue);
  if (!Number.isFinite(amount) || amount < 5 || amount > 1000000) throw new HttpError(400, "Buy, Hold, and Sell require an amount of at least $5.");
  return { portfolio_action: action, action_amount: Number(amount.toFixed(2)) };
}

function roundPrice(value: number) {
  return Number(value.toFixed(6));
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function isPast(value: string | null | undefined, now = new Date()) {
  return Boolean(value && new Date(value).getTime() < now.getTime());
}

function providerTime(value: unknown, fallback: string) {
  if (value === null || value === undefined || value === "") return fallback;
  const raw = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const numeric = Number(raw);
    const milliseconds = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
    const date = new Date(milliseconds);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

async function getActor(req: Request, service: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new HttpError(401, "Sign in to use Called It.");
  const { data: userData, error: userError } = await service.auth.getUser(token);
  if (userError || !userData.user) throw new HttpError(401, "Your sign-in expired. Sign in again.");
  const { data: profile, error: profileError } = await service
    .from("participants")
    .select("user_id,display_name,active,is_admin")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new HttpError(403, "This login is not linked to a Goblin Investing participant.");
  if (!profile.active && !profile.is_admin) throw new HttpError(403, "This participant is not active.");
  return { user: userData.user, profile };
}

async function getSettings(service: ReturnType<typeof createClient>) {
  const { data, error } = await service
    .from("game_settings")
    .select("called_it_up_percent,called_it_down_percent,called_it_flat_percent,called_it_duration_days,called_it_review_lock_days,called_it_flat_claim_days,called_it_payout")
    .eq("id", "main")
    .single();
  if (error) throw error;
  return {
    up: Number(data.called_it_up_percent),
    down: Number(data.called_it_down_percent),
    flat: Number(data.called_it_flat_percent),
    durationDays: Number(data.called_it_duration_days),
    lockDays: Number(data.called_it_review_lock_days),
    flatClaimDays: Number(data.called_it_flat_claim_days),
    payout: Number(data.called_it_payout)
  };
}

async function getSecurity(service: ReturnType<typeof createClient>, ticker: string) {
  const { data, error } = await service
    .from("securities")
    .select("ticker,company_name,exchange,cik")
    .eq("ticker", ticker)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(400, "Choose a ticker from the stock search results.");
  return data;
}

async function getTwelveDataKey(service: ReturnType<typeof createClient>) {
  const envKey = Deno.env.get("TWELVE_DATA_API_KEY")?.trim();
  if (envKey) return envKey;
  const { data, error } = await service.rpc("edge_get_secret", { secret_name: "twelve_data_api_key" });
  if (error) throw error;
  const key = String(data ?? "").trim();
  if (!key) throw new HttpError(503, "Market price service is not configured yet.");
  return key;
}

async function getMarketSnapshot(service: ReturnType<typeof createClient>, ticker: string, forceFresh = false) {
  const now = new Date();
  if (!forceFresh) {
    const { data: cached, error: cacheError } = await service
      .from("market_quote_cache")
      .select("ticker,price,price_at,provider,fetched_at,expires_at,market_status")
      .eq("ticker", ticker)
      .maybeSingle();
    if (cacheError) throw cacheError;
    if (cached && new Date(cached.expires_at).getTime() > now.getTime()) {
      return {
        ticker,
        price: Number(cached.price),
        price_at: cached.price_at,
        fetched_at: cached.fetched_at,
        market_status: cached.market_status ?? "unknown",
        provider: cached.provider,
        cached: true
      };
    }
  }

  const apiKey = await getTwelveDataKey(service);
  const response = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(ticker)}`, {
    headers: { "Authorization": `apikey ${apiKey}`, "Accept": "application/json" }
  });
  let payload: Record<string, unknown> = {};
  try {
    payload = await response.json();
  } catch {
    throw new HttpError(502, "Market price service returned an unreadable response.");
  }
  if (!response.ok || payload.status === "error") {
    const message = typeof payload.message === "string" ? payload.message : `Market price service returned HTTP ${response.status}.`;
    if (response.status === 429) throw new HttpError(503, "Market price service is temporarily rate-limited. Try again later.");
    throw new HttpError(502, message);
  }

  const price = Number(payload.close);
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(502, "Market price service did not return a valid current price.");
  const fetchedAt = now.toISOString();
  const priceAt = payload.last_update_at !== undefined
    ? providerTime(payload.last_update_at, fetchedAt)
    : providerTime(payload.timestamp, fetchedAt);
  const marketStatus = payload.is_market_open === true ? "open" : payload.is_market_open === false ? "closed" : "unknown";
  const snapshot = {
    ticker,
    price: roundPrice(price),
    price_at: priceAt,
    fetched_at: fetchedAt,
    market_status: marketStatus,
    provider: "twelve_data",
    cached: false
  };

  const { error: cacheWriteError } = await service.from("market_quote_cache").upsert({
    ticker,
    price: snapshot.price,
    price_at: snapshot.price_at,
    provider: snapshot.provider,
    market_status: snapshot.market_status,
    fetched_at: fetchedAt,
    expires_at: new Date(now.getTime() + QUOTE_CACHE_SECONDS * 1000).toISOString()
  }, { onConflict: "ticker" });
  if (cacheWriteError) console.error("Quote cache write failed", cacheWriteError);
  return snapshot;
}

function calculateTerms(referencePrice: number, direction: string, settings: Awaited<ReturnType<typeof getSettings>>, startAt: string) {
  const expiresAt = addDays(startAt, settings.durationDays);
  if (direction === "up") {
    return {
      target_percent: settings.up,
      target_price: roundPrice(referencePrice * (1 + settings.up / 100)),
      target_low: null,
      target_high: null,
      expires_at: expiresAt,
      claim_until: expiresAt
    };
  }
  if (direction === "down") {
    return {
      target_percent: settings.down,
      target_price: roundPrice(referencePrice * (1 - settings.down / 100)),
      target_low: null,
      target_high: null,
      expires_at: expiresAt,
      claim_until: expiresAt
    };
  }
  return {
    target_percent: settings.flat,
    target_price: roundPrice(referencePrice),
    target_low: roundPrice(referencePrice * (1 - settings.flat / 100)),
    target_high: roundPrice(referencePrice * (1 + settings.flat / 100)),
    expires_at: expiresAt,
    claim_until: addDays(expiresAt, settings.flatClaimDays)
  };
}

function evaluateChallenge(challenge: Record<string, unknown>, quote: { price: number }, now = new Date()) {
  if (challenge.status !== "active") return false;
  const direction = String(challenge.direction);
  const expiresAt = challenge.expires_at ? new Date(String(challenge.expires_at)) : null;
  const claimUntil = challenge.claim_until ? new Date(String(challenge.claim_until)) : expiresAt;
  if (direction === "flat") {
    if (!expiresAt || now.getTime() < expiresAt.getTime()) return false;
    if (claimUntil && now.getTime() > claimUntil.getTime()) return false;
    return quote.price >= Number(challenge.target_low) && quote.price <= Number(challenge.target_high);
  }
  if (expiresAt && now.getTime() > expiresAt.getTime()) return false;
  if (direction === "up") return quote.price >= Number(challenge.target_price);
  if (direction === "down") return quote.price <= Number(challenge.target_price);
  return false;
}

async function cleanupExpired(service: ReturnType<typeof createClient>, ownerId: string) {
  const { data, error } = await service
    .from("called_it_plays")
    .select("id,direction,expires_at,claim_until,status")
    .eq("owner_id", ownerId)
    .eq("status", "active");
  if (error) throw error;
  const now = new Date();
  const expiredIds = (data ?? []).filter((play) => {
    if (play.direction === "flat") return isPast(play.claim_until || play.expires_at, now);
    return isPast(play.expires_at, now);
  }).map((play) => play.id);
  if (expiredIds.length) {
    const { error: expireError } = await service.from("called_it_plays").update({ status: "expired" }).in("id", expiredIds);
    if (expireError) throw expireError;
  }
}

async function getOwnerProfile(service: ReturnType<typeof createClient>, ownerId: string) {
  const { data, error } = await service
    .from("participants")
    .select("user_id,display_name,active,is_admin")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.active) throw new HttpError(400, "Choose an active participant.");
  return data;
}

async function loadChallenge(service: ReturnType<typeof createClient>, challengeId: unknown) {
  const id = String(challengeId ?? "").trim();
  if (!id) throw new HttpError(400, "Challenge ID is required.");
  const { data, error } = await service.from("called_it_plays").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Challenge not found.");
  return data;
}

function assertChallengeAccess(actor: Awaited<ReturnType<typeof getActor>>, challenge: Record<string, unknown>) {
  if (actor.profile.is_admin) return;
  if (challenge.owner_id !== actor.user.id) throw new HttpError(403, "You can only manage your own challenge.");
}

async function createChallenge(service: ReturnType<typeof createClient>, actor: Awaited<ReturnType<typeof getActor>>, body: Record<string, unknown>) {
  const ownerId = actor.profile.is_admin && body.owner_id ? String(body.owner_id) : actor.user.id;
  await getOwnerProfile(service, ownerId);
  await cleanupExpired(service, ownerId);

  const slotNumber = Number(body.slot_number);
  if (![1, 2].includes(slotNumber)) throw new HttpError(400, "Choose challenge slot 1 or 2.");
  const ticker = normalizeTicker(body.ticker);
  const direction = normalizeDirection(body.direction);
  const reason = normalizeReason(body.reason);
  const action = normalizePortfolioAction(body.portfolio_action, body.action_amount);

  const nowIso = new Date().toISOString();
  const { data: locks, error: lockError } = await service
    .from("called_it_plays")
    .select("lock_until")
    .eq("owner_id", ownerId)
    .eq("slot_number", slotNumber)
    .gt("lock_until", nowIso)
    .order("lock_until", { ascending: false })
    .limit(1);
  if (lockError) throw lockError;
  if (locks?.length) throw new HttpError(409, "This slot is still in its review cooldown.", { lock_until: locks[0].lock_until });

  const { data: occupied, error: occupiedError } = await service
    .from("called_it_plays")
    .select("id,status")
    .eq("owner_id", ownerId)
    .eq("slot_number", slotNumber)
    .in("status", ["active", "under_review"])
    .limit(1);
  if (occupiedError) throw occupiedError;
  if (occupied?.length) throw new HttpError(409, "That challenge slot is already in use.");

  const { data: duplicate, error: duplicateError } = await service
    .from("called_it_plays")
    .select("id,slot_number,direction")
    .eq("owner_id", ownerId)
    .eq("ticker", ticker)
    .in("status", ["active", "under_review"])
    .limit(1);
  if (duplicateError) throw duplicateError;
  if (duplicate?.length) throw new HttpError(409, `You already have an active ${ticker} challenge.`);

  const security = await getSecurity(service, ticker);
  const settings = await getSettings(service);
  const quote = await getMarketSnapshot(service, ticker, true);
  const terms = calculateTerms(quote.price, direction, settings, quote.fetched_at);

  const payload = {
    owner_id: ownerId,
    slot_number: slotNumber,
    ticker,
    company_name: security.company_name,
    exchange: security.exchange,
    reference_price: quote.price,
    reference_price_at: quote.price_at,
    direction,
    ...terms,
    reason,
    portfolio_action: action.portfolio_action,
    action_amount: action.action_amount,
    status: "active",
    amount_committed: action.action_amount,
    call_price: quote.price,
    call_date: quote.fetched_at.slice(0, 10),
    research_note: null,
    thesis: null
  };
  const { data, error } = await service.from("called_it_plays").insert(payload).select("*").single();
  if (error) throw error;
  return { challenge: data, quote, settings };
}

async function checkChallenge(service: ReturnType<typeof createClient>, actor: Awaited<ReturnType<typeof getActor>>, body: Record<string, unknown>) {
  let challenge = await loadChallenge(service, body.challenge_id);
  assertChallengeAccess(actor, challenge);
  if (challenge.status === "under_review") return { challenge, target_met: true, can_submit_for_review: false };
  if (challenge.status !== "active") throw new HttpError(409, `This challenge is ${String(challenge.status).replaceAll("_", " ")}.`);

  const now = new Date();
  const hardEnd = challenge.direction === "flat" ? challenge.claim_until || challenge.expires_at : challenge.expires_at;
  if (isPast(hardEnd, now)) {
    const { data, error } = await service.from("called_it_plays").update({ status: "expired" }).eq("id", challenge.id).select("*").single();
    if (error) throw error;
    return { challenge: data, target_met: false, can_submit_for_review: false, expired: true };
  }

  const quote = await getMarketSnapshot(service, challenge.ticker, false);
  const targetMet = evaluateChallenge(challenge, quote, new Date(quote.fetched_at));
  const { data, error } = await service.from("called_it_plays").update({
    last_checked_price: quote.price,
    last_checked_at: quote.price_at
  }).eq("id", challenge.id).select("*").single();
  if (error) throw error;
  challenge = data;
  return { challenge, quote, target_met: targetMet, can_submit_for_review: targetMet };
}

async function submitChallenge(service: ReturnType<typeof createClient>, actor: Awaited<ReturnType<typeof getActor>>, body: Record<string, unknown>) {
  let challenge = await loadChallenge(service, body.challenge_id);
  assertChallengeAccess(actor, challenge);
  if (challenge.status !== "active") throw new HttpError(409, "Only an active challenge can be submitted for review.");

  const now = new Date();
  if (challenge.direction === "flat" && new Date(challenge.expires_at).getTime() > now.getTime()) {
    throw new HttpError(409, "Finish About the Same is checked at the end of the challenge period.");
  }
  const hardEnd = challenge.direction === "flat" ? challenge.claim_until || challenge.expires_at : challenge.expires_at;
  if (isPast(hardEnd, now)) {
    await service.from("called_it_plays").update({ status: "expired" }).eq("id", challenge.id);
    throw new HttpError(409, "This challenge has expired.");
  }

  const settings = await getSettings(service);
  const quote = await getMarketSnapshot(service, challenge.ticker, true);
  const targetMet = evaluateChallenge(challenge, quote, new Date(quote.fetched_at));
  if (!targetMet) {
    await service.from("called_it_plays").update({ last_checked_price: quote.price, last_checked_at: quote.price_at }).eq("id", challenge.id);
    throw new HttpError(409, "Target is no longer met. Check again later.", { quote, target_met: false });
  }

  const submittedAt = new Date().toISOString();
  const lockUntil = addDays(submittedAt, settings.lockDays);
  const { data, error } = await service.from("called_it_plays").update({
    last_checked_price: quote.price,
    last_checked_at: quote.price_at,
    qualifying_price: quote.price,
    qualifying_price_at: quote.price_at,
    submitted_at: submittedAt,
    lock_until: lockUntil,
    status: "under_review"
  }).eq("id", challenge.id).select("*").single();
  if (error) throw error;
  challenge = data;
  return { challenge, quote, target_met: true, can_submit_for_review: false };
}

async function cancelChallenge(service: ReturnType<typeof createClient>, actor: Awaited<ReturnType<typeof getActor>>, body: Record<string, unknown>) {
  const challenge = await loadChallenge(service, body.challenge_id);
  assertChallengeAccess(actor, challenge);
  if (challenge.status !== "active") throw new HttpError(409, "Only an active challenge can be cancelled.");
  const { data, error } = await service.from("called_it_plays").update({ status: "cancelled" }).eq("id", challenge.id).select("*").single();
  if (error) throw error;
  return { challenge: data };
}

async function reviewChallenge(service: ReturnType<typeof createClient>, actor: Awaited<ReturnType<typeof getActor>>, body: Record<string, unknown>) {
  if (!actor.profile.is_admin) throw new HttpError(403, "Admin access is required.");
  const challenge = await loadChallenge(service, body.challenge_id);
  if (challenge.status !== "under_review") throw new HttpError(409, "Only a challenge under review can be approved or rejected.");
  const decision = String(body.decision ?? "").toLowerCase();
  if (!["approved", "rejected"].includes(decision)) throw new HttpError(400, "Choose Approve or Reject.");
  const note = String(body.review_note ?? "").trim();
  if (note.length > 2000) throw new HttpError(400, "Review note must be 2,000 characters or less.");
  const { data, error } = await service.from("called_it_plays").update({
    status: decision,
    reviewed_at: new Date().toISOString(),
    reviewed_by: actor.user.id,
    review_note: note || null
  }).eq("id", challenge.id).select("*").single();
  if (error) throw error;
  return { challenge: data };
}

async function resetCooldown(service: ReturnType<typeof createClient>, actor: Awaited<ReturnType<typeof getActor>>, body: Record<string, unknown>) {
  if (!actor.profile.is_admin) throw new HttpError(403, "Admin access is required.");
  const challenge = await loadChallenge(service, body.challenge_id);
  if (!["approved", "rejected"].includes(challenge.status)) throw new HttpError(409, "Cooldown can be reset after review is complete.");
  const { data, error } = await service.from("called_it_plays").update({ lock_until: new Date().toISOString() }).eq("id", challenge.id).select("*").single();
  if (error) throw error;
  return { challenge: data };
}

async function adminEditChallenge(service: ReturnType<typeof createClient>, actor: Awaited<ReturnType<typeof getActor>>, body: Record<string, unknown>) {
  if (!actor.profile.is_admin) throw new HttpError(403, "Admin access is required.");
  const challenge = await loadChallenge(service, body.challenge_id);
  if (challenge.status !== "active") throw new HttpError(409, "Only an active challenge can be edited.");

  const ticker = body.ticker === undefined ? challenge.ticker : normalizeTicker(body.ticker);
  const direction = body.direction === undefined ? challenge.direction : normalizeDirection(body.direction);
  const reason = body.reason === undefined ? challenge.reason : normalizeReason(body.reason);
  const portfolioAction = body.portfolio_action === undefined ? challenge.portfolio_action : body.portfolio_action;
  const actionAmount = body.portfolio_action === undefined && body.action_amount === undefined ? challenge.action_amount : body.action_amount;
  const action = normalizePortfolioAction(portfolioAction, actionAmount);
  const termsChanged = ticker !== challenge.ticker || direction !== challenge.direction;

  const update: Record<string, unknown> = {
    reason,
    portfolio_action: action.portfolio_action,
    action_amount: action.action_amount,
    amount_committed: action.action_amount
  };

  if (termsChanged) {
    const { data: duplicate, error: duplicateError } = await service
      .from("called_it_plays")
      .select("id")
      .eq("owner_id", challenge.owner_id)
      .eq("ticker", ticker)
      .in("status", ["active", "under_review"])
      .neq("id", challenge.id)
      .limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicate?.length) throw new HttpError(409, `This participant already has an active ${ticker} challenge.`);
    const security = await getSecurity(service, ticker);
    const settings = await getSettings(service);
    const quote = await getMarketSnapshot(service, ticker, true);
    Object.assign(update, {
      ticker,
      company_name: security.company_name,
      exchange: security.exchange,
      reference_price: quote.price,
      reference_price_at: quote.price_at,
      direction,
      ...calculateTerms(quote.price, direction, settings, quote.fetched_at),
      call_price: quote.price,
      call_date: quote.fetched_at.slice(0, 10),
      last_checked_price: null,
      last_checked_at: null,
      qualifying_price: null,
      qualifying_price_at: null,
      submitted_at: null,
      reviewed_at: null,
      reviewed_by: null,
      review_note: null
    });
  }

  const { data, error } = await service.from("called_it_plays").update(update).eq("id", challenge.id).select("*").single();
  if (error) throw error;
  return { challenge: data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Supabase service configuration is unavailable." }, 500);

  const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const actor = await getActor(req, service);
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = String(body.action ?? "").trim().toLowerCase();

    if (action === "preview") {
      const ticker = normalizeTicker(body.ticker);
      const security = await getSecurity(service, ticker);
      const quote = await getMarketSnapshot(service, ticker, false);
      return json({ security, quote, settings: await getSettings(service) });
    }
    if (action === "create") return json(await createChallenge(service, actor, body), 201);
    if (action === "check") return json(await checkChallenge(service, actor, body));
    if (action === "submit") return json(await submitChallenge(service, actor, body));
    if (action === "cancel") return json(await cancelChallenge(service, actor, body));
    if (action === "review") return json(await reviewChallenge(service, actor, body));
    if (action === "reset_cooldown") return json(await resetCooldown(service, actor, body));
    if (action === "admin_edit") return json(await adminEditChallenge(service, actor, body));
    throw new HttpError(400, "Unknown Called It action.");
  } catch (error) {
    console.error(error);
    if (error instanceof HttpError) return json({ error: error.message, ...(error.details ?? {}) }, error.status);
    return json({ error: error instanceof Error ? error.message : "Called It request failed." }, 500);
  }
});
