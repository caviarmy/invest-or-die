import { getBackendClient } from './backend.js';

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
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
      setText('ruleUpPercent', Number(data.called_it_up_percent).toLocaleString());
      setText('ruleDownPercent', Number(data.called_it_down_percent).toLocaleString());
      setText('ruleFlatPercent', Number(data.called_it_flat_percent).toLocaleString());
      document.querySelectorAll('[data-rule-duration]').forEach(element => { element.textContent = Number(data.called_it_duration_days).toLocaleString(); });
      document.querySelectorAll('[data-rule-cooldown]').forEach(element => { element.textContent = Number(data.called_it_review_lock_days).toLocaleString(); });
      document.querySelectorAll('[data-rule-claim]').forEach(element => { element.textContent = Number(data.called_it_flat_claim_days).toLocaleString(); });
      document.querySelectorAll('[data-rule-payout]').forEach(element => { element.textContent = Number(data.called_it_payout).toLocaleString(undefined, { style: 'currency', currency: 'USD' }); });
    }
  }
} catch (error) {
  console.error('Could not refresh public game rules.', error);
}
