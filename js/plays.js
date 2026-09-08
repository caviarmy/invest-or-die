const EMPTY_SETTINGS = {
  current_week: null,
  weekly_stock_buy_min: null,
  called_it_up_percent: null,
  called_it_down_percent: null,
  called_it_flat_percent: null,
  called_it_duration_days: null,
  called_it_review_lock_days: null,
  called_it_flat_claim_days: null,
  called_it_payout: null
};

export function fallbackDashboardData() {
  return {
    available: false,
    participants: [],
    plays: [],
    winner: null,
    history: [],
    settings: { ...EMPTY_SETTINGS }
  };
}

export async function loadDashboardData(client) {
  if (!client) return fallbackDashboardData();

  const [participantsResult, playsResult, winnerResult, historyResult, settingsResult] = await Promise.all([
    client.from('participants').select('user_id,display_name,sort_order,active,is_admin').eq('active', true).order('sort_order', { ascending: true }),
    client.from('called_it_plays').select('id,owner_id,slot_number,ticker,company_name,exchange,reference_price,reference_price_at,direction,target_percent,target_price,target_low,target_high,reason,portfolio_action,action_amount,expires_at,claim_until,last_checked_price,last_checked_at,qualifying_price,qualifying_price_at,submitted_at,lock_until,reviewed_at,reviewed_by,review_note,status,created_at,updated_at').order('created_at', { ascending: false }),
    client.from('weekly_winner').select('id,winner_user_id,week_start,week_end,winner_name,return_percent,chart_url,updated_at').order('week_end', { ascending: false }).limit(1).maybeSingle(),
    client.from('results_history').select('id,event_type,participant_user_id,participant_name,event_date,week_number,week_start,week_end,ticker,return_percent,call_price,target_price,target_low,target_high,direction,starting_price,qualifying_price,submitted_at,reviewed_at,status,review_note,reward_amount,source_table,source_id,created_at').order('event_date', { ascending: false }).order('created_at', { ascending: false }),
    client.from('game_settings').select('current_week,weekly_stock_buy_min,called_it_up_percent,called_it_down_percent,called_it_flat_percent,called_it_duration_days,called_it_review_lock_days,called_it_flat_claim_days,called_it_payout').eq('id', 'main').maybeSingle()
  ]);

  if (participantsResult.error) throw participantsResult.error;
  if (playsResult.error) throw playsResult.error;
  if (winnerResult.error) throw winnerResult.error;
  if (historyResult.error) throw historyResult.error;
  if (settingsResult.error) throw settingsResult.error;

  return {
    available: true,
    participants: participantsResult.data || [],
    plays: playsResult.data || [],
    winner: winnerResult.data || null,
    history: historyResult.data || [],
    settings: { ...EMPTY_SETTINGS, ...(settingsResult.data || {}) }
  };
}

export function getOwnerSlots(plays, ownerId) {
  const now = Date.now();
  return [1, 2].map(slotNumber => {
    const slotRows = (plays || []).filter(play => play.owner_id === ownerId && Number(play.slot_number) === slotNumber);
    const current = slotRows.find(play => ['active', 'under_review'].includes(play.status));
    if (current) return current;
    return slotRows.find(play => ['approved', 'rejected'].includes(play.status) && play.lock_until && new Date(play.lock_until).getTime() > now) || null;
  });
}

export async function saveGameSettings(client, values) {
  if (!client) throw new Error('Admin editing is not available yet.');
  const payload = {
    current_week: Number(values.current_week),
    weekly_stock_buy_min: Number(values.weekly_stock_buy_min),
    called_it_up_percent: Number(values.called_it_up_percent),
    called_it_down_percent: Number(values.called_it_down_percent),
    called_it_flat_percent: Number(values.called_it_flat_percent),
    called_it_duration_days: Number(values.called_it_duration_days),
    called_it_review_lock_days: Number(values.called_it_review_lock_days),
    called_it_flat_claim_days: Number(values.called_it_flat_claim_days),
    called_it_payout: Number(values.called_it_payout),
    updated_at: new Date().toISOString()
  };

  if (!Number.isInteger(payload.current_week) || payload.current_week < 1) throw new Error('Enter a valid game week.');
  if (!Number.isFinite(payload.weekly_stock_buy_min) || payload.weekly_stock_buy_min <= 0) throw new Error('Enter a valid weekly purchase amount.');
  if (!Number.isFinite(payload.called_it_up_percent) || payload.called_it_up_percent <= 0 || payload.called_it_up_percent > 100) throw new Error('Enter a valid Goes Up percentage.');
  if (!Number.isFinite(payload.called_it_down_percent) || payload.called_it_down_percent <= 0 || payload.called_it_down_percent >= 100) throw new Error('Enter a valid Goes Down percentage.');
  if (!Number.isFinite(payload.called_it_flat_percent) || payload.called_it_flat_percent <= 0 || payload.called_it_flat_percent > 25) throw new Error('Enter a valid About the Same percentage.');
  if (!Number.isInteger(payload.called_it_duration_days) || payload.called_it_duration_days < 1) throw new Error('Enter a valid challenge duration.');
  if (!Number.isInteger(payload.called_it_review_lock_days) || payload.called_it_review_lock_days < 0) throw new Error('Enter a valid review cooldown.');
  if (!Number.isInteger(payload.called_it_flat_claim_days) || payload.called_it_flat_claim_days < 1) throw new Error('Enter a valid flat claim window.');
  if (!Number.isFinite(payload.called_it_payout) || payload.called_it_payout < 0) throw new Error('Enter a valid Called It payout.');

  const { error } = await client.from('game_settings').update(payload).eq('id', 'main');
  if (error) throw error;
}

export async function saveWeeklyWinner(client, values, chartFile) {
  if (!client) throw new Error('Admin editing is not available yet.');
  let chartUrl = values.chart_url || null;

  if (chartFile) {
    const extension = chartFile.name.split('.').pop()?.toLowerCase();
    const safeExtension = ['png', 'jpg', 'jpeg', 'webp'].includes(extension) ? extension : 'png';
    const path = `current.${safeExtension}`;
    const { error: uploadError } = await client.storage.from('weekly-charts').upload(path, chartFile, { upsert: true, contentType: chartFile.type || undefined });
    if (uploadError) throw uploadError;
    const { data } = client.storage.from('weekly-charts').getPublicUrl(path);
    chartUrl = data.publicUrl;
  }

  const payload = {
    winner_user_id: values.winner_user_id || null,
    week_start: values.week_start,
    week_end: values.week_end,
    winner_name: values.winner_name.trim(),
    return_percent: Number(values.return_percent),
    chart_url: chartUrl
  };

  if (!payload.winner_name) throw new Error('Winner name is required.');
  if (!Number.isFinite(payload.return_percent)) throw new Error('Enter a valid weekly return.');

  const { data: existing, error: lookupError } = await client.from('weekly_winner').select('id').eq('week_start', payload.week_start).eq('week_end', payload.week_end).maybeSingle();
  if (lookupError) throw lookupError;

  if (existing?.id) {
    const { error } = await client.from('weekly_winner').update(payload).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await client.from('weekly_winner').insert(payload);
    if (error) throw error;
  }
}
