import { getBackendClient } from './backend.js';

function finiteSettingNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function setAll(selector, value) {
  document.querySelectorAll(selector).forEach(element => { element.textContent = String(value); });
}

function formatMoney(value) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatPercent(value) {
  return `${value.toLocaleString()}%`;
}

function showSettingsStatus(message) {
  const element = document.getElementById('rulesSettingsStatus');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
}

function hideSettingsStatus() {
  const element = document.getElementById('rulesSettingsStatus');
  if (element) element.hidden = true;
}

function renderSettings(data) {
  const up = finiteSettingNumber(data.called_it_up_percent);
  const down = finiteSettingNumber(data.called_it_down_percent);
  const flat = finiteSettingNumber(data.called_it_flat_percent);
  const duration = finiteSettingNumber(data.called_it_duration_days);
  const cooldown = finiteSettingNumber(data.called_it_review_lock_days);
  const claim = finiteSettingNumber(data.called_it_flat_claim_days);
  const payout = finiteSettingNumber(data.called_it_payout);

  if (up !== null && duration !== null) setText('ruleUpGoal', `the stock reaches ${formatPercent(up)} above the starting price within ${duration.toLocaleString()} days.`);
  if (down !== null && duration !== null) setText('ruleDownGoal', `the stock reaches ${formatPercent(down)} below the starting price within ${duration.toLocaleString()} days.`);
  if (flat !== null && duration !== null) setText('ruleFlatGoal', `after ${duration.toLocaleString()} days, the stock is within ${formatPercent(flat)} above or below the starting price.`);
  if (duration !== null) setAll('[data-rule-duration-adjective]', `${duration.toLocaleString()}-day`);
  if (claim !== null) setAll('[data-rule-claim-phrase]', `${claim.toLocaleString()} days`);
  if (cooldown !== null) setAll('[data-rule-cooldown-phrase]', `${cooldown.toLocaleString()} days`);
  if (payout !== null) setAll('[data-rule-payout]', formatMoney(payout));

  const complete = [up, down, flat, duration, cooldown, claim, payout].every(value => value !== null);
  if (complete) hideSettingsStatus();
  else showSettingsStatus('Some current Called It settings are unavailable. Fixed rules still apply; unavailable values are labeled below.');
}

try {
  const client = await getBackendClient();
  if (!client) {
    showSettingsStatus('Current Called It settings could not be loaded. Fixed rules still apply; configurable values are labeled below.');
  } else {
    const { data, error } = await client
      .from('game_settings')
      .select('called_it_up_percent,called_it_down_percent,called_it_flat_percent,called_it_duration_days,called_it_review_lock_days,called_it_flat_claim_days,called_it_payout')
      .eq('id', 'main')
      .maybeSingle();
    if (error) throw error;
    if (data) renderSettings(data);
    else showSettingsStatus('Current Called It settings could not be loaded. Fixed rules still apply; configurable values are labeled below.');
  }
} catch (error) {
  showSettingsStatus('Current Called It settings could not be loaded. Fixed rules still apply; configurable values are labeled below.');
  console.error('Could not refresh public game rules.', error);
}
