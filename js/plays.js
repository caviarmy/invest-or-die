const FALLBACK_PARTICIPANTS = [
  { user_id: null, display_name: 'Covey', sort_order: 1, active: true, is_admin: false },
  { user_id: null, display_name: 'Cal', sort_order: 2, active: true, is_admin: false },
  { user_id: null, display_name: 'Charbonneau', sort_order: 3, active: true, is_admin: false }
];

export function fallbackDashboardData() {
  return {
    participants: FALLBACK_PARTICIPANTS,
    plays: [],
    winner: null,
    history: [],
    settings: { current_week: 6, weekly_stock_buy_min: 5 }
  };
}

export async function loadDashboardData(client) {
  if (!client) return fallbackDashboardData();

  const [participantsResult, playsResult, winnerResult, historyResult, settingsResult] = await Promise.all([
    client.from('participants').select('user_id,display_name,sort_order,active,is_admin').eq('active', true).order('sort_order', { ascending: true }),
    client.from('called_it_plays').select('id,owner_id,slot_number,ticker,company_name,amount_committed,call_price,target_price,call_date,expires_at,research_note,thesis,status,created_at,updated_at').eq('status', 'active').order('slot_number', { ascending: true }),
    client.from('weekly_winner').select('id,winner_user_id,week_start,week_end,winner_name,return_percent,chart_url,updated_at').order('week_end', { ascending: false }).limit(1).maybeSingle(),
    client.from('results_history').select('id,event_type,participant_user_id,participant_name,event_date,week_number,week_start,week_end,ticker,return_percent,call_price,target_price,reward_amount,created_at').order('event_date', { ascending: false }).order('created_at', { ascending: false }),
    client.from('game_settings').select('current_week,weekly_stock_buy_min').eq('id', 'main').maybeSingle()
  ]);

  if (participantsResult.error) throw participantsResult.error;
  if (playsResult.error) throw playsResult.error;
  if (winnerResult.error) throw winnerResult.error;
  if (historyResult.error) throw historyResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const participants = participantsResult.data?.length ? participantsResult.data : FALLBACK_PARTICIPANTS;

  return {
    participants,
    plays: playsResult.data || [],
    winner: winnerResult.data || null,
    history: historyResult.data || [],
    settings: settingsResult.data || { current_week: 6, weekly_stock_buy_min: 5 }
  };
}

export function getOwnerSlots(plays, ownerId) {
  return [1, 2].map(slotNumber => plays.find(play => play.owner_id === ownerId && Number(play.slot_number) === slotNumber) || null);
}

function normalizeTicker(value) {
  return String(value || '').trim().toUpperCase();
}

function toIsoDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error('Choose a valid call date.');
  return date;
}

export function buildPlayPayload(formData, ownerId, slotNumber) {
  const ticker = normalizeTicker(formData.get('ticker'));
  const amount = Number(formData.get('amount_committed'));
  const callPrice = Number(formData.get('call_price'));
  const callDateValue = String(formData.get('call_date') || '');
  const researchNote = String(formData.get('research_note') || '').trim();
  const thesis = String(formData.get('thesis') || '').trim();

  if (!ownerId) throw new Error('Your account is not linked to a participant profile.');
  if (!/^[A-Z0-9.\-]{1,12}$/.test(ticker)) throw new Error('Ticker must be 1 to 12 letters, numbers, dots, or dashes.');
  if (!Number.isFinite(amount) || amount < 5 || amount > 1000000) throw new Error('Amount committed must be at least $5.');
  if (!Number.isFinite(callPrice) || callPrice <= 0 || callPrice > 1000000) throw new Error('Enter a valid call price.');
  if (researchNote.length > 800) throw new Error('What I found must be 800 characters or less.');
  if (thesis.length > 800) throw new Error('My call must be 800 characters or less.');

  const callDate = toIsoDate(callDateValue);
  const expiresAt = new Date(callDate);
  expiresAt.setDate(expiresAt.getDate() + 28);

  return {
    owner_id: ownerId,
    slot_number: slotNumber,
    ticker,
    amount_committed: Number(amount.toFixed(2)),
    call_price: Number(callPrice.toFixed(4)),
    target_price: Number((callPrice * 1.10).toFixed(4)),
    call_date: callDateValue,
    expires_at: expiresAt.toISOString().slice(0, 10),
    research_note: researchNote || null,
    thesis: thesis || null,
    status: 'active'
  };
}

export async function savePlay(client, currentPlay, payload) {
  if (!client) throw new Error('Editing is not available yet.');
  if (currentPlay?.id) {
    const { error } = await client.from('called_it_plays').update(payload).eq('id', currentPlay.id);
    if (error) throw error;
    return;
  }
  const { error } = await client.from('called_it_plays').insert(payload);
  if (error) throw error;
}

export async function cancelPlay(client, play) {
  if (!client || !play?.id) throw new Error('There is no active play to cancel.');
  const { error } = await client.from('called_it_plays').update({ status: 'cancelled' }).eq('id', play.id);
  if (error) throw error;
}

export async function cashOutCalledIt(client, play) {
  if (!client || !play?.id) throw new Error('There is no active play to cash out.');
  const { error } = await client.from('called_it_plays').update({ status: 'called_it' }).eq('id', play.id);
  if (error) throw error;
}

export async function replacePlay(client, currentPlay, payload) {
  if (!client || !currentPlay?.id) throw new Error('There is no active play to replace.');
  const { error: cancelError } = await client.from('called_it_plays').update({ status: 'cancelled' }).eq('id', currentPlay.id);
  if (cancelError) throw cancelError;
  const { error: insertError } = await client.from('called_it_plays').insert(payload);
  if (insertError) throw insertError;
}

export async function saveGameSettings(client, currentWeek, weeklyStockBuyMin = 5) {
  if (!client) throw new Error('Admin editing is not available yet.');
  const week = Number(currentWeek);
  const weeklyMin = Number(weeklyStockBuyMin);
  if (!Number.isInteger(week) || week < 1) throw new Error('Enter a valid game week.');
  if (!Number.isFinite(weeklyMin) || weeklyMin <= 0) throw new Error('Enter a valid weekly purchase amount.');
  const { error } = await client.from('game_settings').update({
    current_week: week,
    weekly_stock_buy_min: weeklyMin,
    updated_at: new Date().toISOString()
  }).eq('id', 'main');
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
