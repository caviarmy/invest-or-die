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

try {
  const client = await getBackendClient();
  if (client) {
    const { data, error } = await client
      .from('game_settings')
      .select('called_it_up_percent,called_it_down_percent,called_it_flat_percent,called_it_duration_days,called_it_review_lock_days,called_it_flat_claim_days,called_it_payout')
      .eq('id', 'main')
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const up = finiteSettingNumber(data.called_it_up_percent);
      const down = finiteSettingNumber(data.called_it_down_percent);
      const flat = finiteSettingNumber(data.called_it_flat_percent);
      const duration = finiteSettingNumber(data.called_it_duration_days);
      const cooldown = finiteSettingNumber(data.called_it_review_lock_days);
      const claim = finiteSettingNumber(data.called_it_flat_claim_days);
      const payout = finiteSettingNumber(data.called_it_payout);

      if (up !== null) setText('ruleUpPercent', formatPercent(up));
      if (down !== null) setText('ruleDownPercent', formatPercent(down));
      if (flat !== null) setText('ruleFlatPercent', formatPercent(flat));
      if (duration !== null) setAll('[data-rule-duration]', duration.toLocaleString());
      if (cooldown !== null) setAll('[data-rule-cooldown]', cooldown.toLocaleString());
      if (claim !== null) setAll('[data-rule-claim]', claim.toLocaleString());
      if (payout !== null) setAll('[data-rule-payout]', formatMoney(payout));
    }
  }
} catch (error) {
  console.error('Could not refresh public game rules.', error);
}
