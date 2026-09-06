import { getBackendConfig } from './backend.js';

function cleanSearch(value) {
  return String(value || '').trim().replace(/[%_]/g, '').slice(0, 80);
}

export async function searchSecurities(client, value, limit = 10) {
  if (!client) return [];
  const query = cleanSearch(value);
  if (query.length < 1) return [];
  const tickerQuery = query.toUpperCase();
  const seen = new Set();
  const results = [];

  const addRows = rows => {
    for (const row of rows || []) {
      if (seen.has(row.ticker)) continue;
      seen.add(row.ticker);
      results.push(row);
      if (results.length >= limit) break;
    }
  };

  const exact = await client.from('securities').select('ticker,company_name,exchange').eq('ticker', tickerQuery).eq('active', true).limit(1);
  if (exact.error) throw exact.error;
  addRows(exact.data);
  if (results.length >= limit) return results;

  const tickerPrefix = await client.from('securities').select('ticker,company_name,exchange').ilike('ticker', `${tickerQuery}%`).eq('active', true).order('ticker').limit(limit);
  if (tickerPrefix.error) throw tickerPrefix.error;
  addRows(tickerPrefix.data);
  if (results.length >= limit) return results;

  const companyPrefix = await client.from('securities').select('ticker,company_name,exchange').ilike('company_name', `${query}%`).eq('active', true).order('company_name').limit(limit);
  if (companyPrefix.error) throw companyPrefix.error;
  addRows(companyPrefix.data);
  if (results.length >= limit) return results;

  const companyContains = await client.from('securities').select('ticker,company_name,exchange').ilike('company_name', `%${query}%`).eq('active', true).order('company_name').limit(limit);
  if (companyContains.error) throw companyContains.error;
  addRows(companyContains.data);
  return results.slice(0, limit);
}

export async function calledItRequest(client, action, payload = {}) {
  if (!client) throw new Error('Sign in to use Called It.');
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData.session;
  if (!session?.access_token) throw new Error('Sign in to use Called It.');

  const config = getBackendConfig();
  if (!config.configured) throw new Error('Called It is not configured.');
  const response = await fetch(`${config.url}/functions/v1/called-it`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': config.publishableKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, ...payload })
  });

  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok) {
    const error = new Error(body.error || 'Called It request failed.');
    error.status = response.status;
    error.details = body;
    throw error;
  }
  return body;
}

export const previewCalledIt = (client, ticker) => calledItRequest(client, 'preview', { ticker });
export const createCalledIt = (client, payload) => calledItRequest(client, 'create', payload);
export const checkCalledIt = (client, challengeId) => calledItRequest(client, 'check', { challenge_id: challengeId });
export const submitCalledIt = (client, challengeId) => calledItRequest(client, 'submit', { challenge_id: challengeId });
export const cancelCalledIt = (client, challengeId) => calledItRequest(client, 'cancel', { challenge_id: challengeId });
export const reviewCalledIt = (client, challengeId, decision, reviewNote = '') => calledItRequest(client, 'review', { challenge_id: challengeId, decision, review_note: reviewNote });
export const resetCalledItCooldown = (client, challengeId) => calledItRequest(client, 'reset_cooldown', { challenge_id: challengeId });
export const adminEditCalledIt = (client, challengeId, payload) => calledItRequest(client, 'admin_edit', { challenge_id: challengeId, ...payload });
