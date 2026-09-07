export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(value) {
  if (!value) return '—';
  const raw = String(value);
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function directionLabel(direction) {
  if (direction === 'up') return 'GOES UP 📈';
  if (direction === 'down') return 'GOES DOWN 📉';
  if (direction === 'flat') return 'FINISHES ABOUT THE SAME';
  return 'PREDICTION';
}

export function actionLabel(play) {
  const amount = play?.action_amount ? money(play.action_amount) : '';
  if (play?.portfolio_action === 'buy') return `Buying ${amount}`;
  if (play?.portfolio_action === 'hold') return `Holding ${amount}`;
  if (play?.portfolio_action === 'sell') return `Selling ${amount}`;
  if (play?.portfolio_action === 'not_buying') return 'Not Buying';
  return '—';
}

export function goalLabel(play) {
  if (!play) return '';
  if (play.direction === 'up') return `Goal ${money(play.target_price)}+`;
  if (play.direction === 'down') return `Goal ${money(play.target_price)} or lower`;
  if (play.direction === 'flat') return `End range ${money(play.target_low)}–${money(play.target_high)}`;
  return '';
}

export function goalPreview(referencePrice, direction, settings) {
  const price = Number(referencePrice);
  if (!Number.isFinite(price) || price <= 0 || !direction || !settings) return 'Choose a prediction to see the goal.';
  if (direction === 'up') return `Needs to reach ${money(price * (1 + Number(settings.up) / 100))} or higher`;
  if (direction === 'down') return `Needs to reach ${money(price * (1 - Number(settings.down) / 100))} or lower`;
  const percent = Number(settings.flat) / 100;
  return `At the end of the challenge: ${money(price * (1 - percent))}–${money(price * (1 + percent))}`;
}

const ACTIONS = {
  up: [
    ['buy', 'Buying at least $5'],
    ['hold', 'Holding at least $5 I already own']
  ],
  down: [
    ['sell', 'Selling at least $5 I already own'],
    ['not_buying', 'Not Buying']
  ],
  flat: [
    ['hold', 'Holding at least $5 I already own'],
    ['not_buying', 'Not Buying']
  ]
};

export function actionOptions(direction, selected = '') {
  const choices = ACTIONS[direction] || [];
  if (!choices.length) return '<option value="">Choose a prediction first</option>';
  const selectedAllowed = choices.some(([value]) => value === selected) ? selected : choices[0][0];
  return choices.map(([value, label]) => `<option value="${value}" ${value === selectedAllowed ? 'selected' : ''}>${label}</option>`).join('');
}

export function predictionButtons(direction = '') {
  const defs = [
    ['up', 'Go Up'],
    ['down', 'Go Down'],
    ['flat', 'Finish About the Same']
  ];
  return defs.map(([value, label]) => `<button type="button" data-single-direction="${value}" class="prediction-choice ${direction === value ? 'selected' : ''}">${label}</button>`).join('');
}

function escapeUrl(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function linkifyPlainText(value) {
  const text = String(value || '');
  const matcher = /(https?:\/\/[^\s]+)/gi;
  let output = '';
  let lastIndex = 0;
  for (const match of text.matchAll(matcher)) {
    const index = match.index ?? 0;
    output += escapeHtml(text.slice(lastIndex, index));
    const url = match[0];
    output += `<a href="${escapeUrl(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    lastIndex = index + url.length;
  }
  output += escapeHtml(text.slice(lastIndex));
  return output.replace(/\n/g, '<br>');
}

export function targetMetFromLastCheck(play) {
  const rawPrice = play?.last_checked_price;
  if (rawPrice === null || rawPrice === undefined || rawPrice === '' || !play?.last_checked_at) return false;
  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price <= 0 || play?.status !== 'active') return false;
  if (play.direction === 'up') return price >= Number(play.target_price);
  if (play.direction === 'down') return price <= Number(play.target_price);
  if (play.direction === 'flat') {
    const now = Date.now();
    const expires = new Date(play.expires_at).getTime();
    const claimUntil = new Date(play.claim_until || play.expires_at).getTime();
    return now >= expires && now <= claimUntil && price >= Number(play.target_low) && price <= Number(play.target_high);
  }
  return false;
}

export function cooldownRemaining(lockUntil) {
  const end = new Date(lockUntil || 0).getTime();
  const remaining = end - Date.now();
  if (remaining <= 0) return '';
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.max(1, Math.floor((remaining % 3600000) / 60000));
  return `${hours}h ${minutes}m`;
}

export function challengeCardMarkup(play, slotNumber, options = {}) {
  const { canManage = false, canEdit = false } = options;
  if (!play) {
    return `<div class="play-slot empty-slot"><div class="slot-label">CHALLENGE ${slotNumber}</div><b>Open slot</b><span>No active challenge.</span></div>`;
  }

  if (['approved', 'rejected'].includes(play.status) && cooldownRemaining(play.lock_until)) {
    return `<div class="play-slot cooldown-slot"><div class="slot-label">CHALLENGE ${slotNumber}</div><div class="review-badge">REVIEW COOLDOWN</div><b>${cooldownRemaining(play.lock_until)} remaining</b><span>Your next challenge can use this slot when the cooldown ends.</span></div>`;
  }

  const qualified = targetMetFromLastCheck(play);
  const review = play.status === 'under_review';
  const hasCheckedPrice = play.last_checked_price !== null && play.last_checked_price !== undefined && play.last_checked_price !== '' && Boolean(play.last_checked_at);
  const current = hasCheckedPrice ? `<div><span>CURRENT</span><b>${money(play.last_checked_price)}</b></div>` : '';
  const checked = play.last_checked_at ? `<div><span>CHECKED</span><b>${formatDateTime(play.last_checked_at)}</b></div>` : '';
  const buttons = review ? '' : canManage ? `
    <button class="button button-secondary challenge-action" type="button" data-check-id="${escapeHtml(play.id)}">Check Price</button>
    ${qualified ? `<button class="button button-primary challenge-action" type="button" data-submit-id="${escapeHtml(play.id)}">Submit for Review</button>` : ''}` : '';
  const editButton = canEdit && play.status === 'active'
    ? `<button class="play-edit-pencil" type="button" data-play-edit-id="${escapeHtml(play.id)}" aria-label="Edit this Called It challenge" title="Edit challenge">✎</button>`
    : '';

  return `<div class="play-slot ${review ? 'play-slot-review' : ''}">
    ${editButton}
    <div class="slot-label">CHALLENGE ${slotNumber}</div>
    <div class="play-ticker">${escapeHtml(play.ticker)}</div>
    <div class="play-company">${escapeHtml(play.company_name || '')}</div>
    <div class="prediction-badge prediction-${escapeHtml(play.direction || 'unknown')}">${directionLabel(play.direction)}</div>
    <div class="play-meta">
      <div><span>FROM</span><b>${money(play.reference_price)}</b></div>
      <div><span>GOAL</span><b>${escapeHtml(goalLabel(play).replace(/^Goal /, ''))}</b></div>
      ${current}${checked}
    </div>
    <div class="play-copy reason-copy"><strong>BECAUSE</strong><div>${linkifyPlainText(play.reason || '')}</div></div>
    <div class="play-copy"><strong>MY MOVE</strong><div>${escapeHtml(actionLabel(play))}</div></div>
    <div class="play-expiry">${play.direction === 'flat' ? 'Ends' : 'Expires'} ${formatDate(play.expires_at)}</div>
    ${qualified && !review ? `<div class="target-reached"><strong>TARGET REACHED</strong><span>${money(play.last_checked_price)} · checked ${formatDateTime(play.last_checked_at)}</span></div>` : ''}
    ${review ? `<div class="under-review-box"><strong>UNDER REVIEW</strong><span>Submitted at ${money(play.qualifying_price)}</span><span>Slot locked for ${cooldownRemaining(play.lock_until) || 'review'}</span></div>` : ''}
    ${buttons}
  </div>`;
}

export function tickerResultMarkup(row) {
  return `<button class="ticker-result" type="button" data-ticker="${escapeHtml(row.ticker)}" data-company="${escapeHtml(row.company_name)}" data-exchange="${escapeHtml(row.exchange || '')}"><strong>${escapeHtml(row.ticker)}</strong><span>${escapeHtml(row.company_name)}</span><small>${escapeHtml(row.exchange || '')}</small></button>`;
}

export function singleChallengeFormMarkup({ play = null, slotNumber = 1, adminEdit = false }) {
  const ticker = play?.ticker || '';
  const company = play?.company_name || '';
  const direction = play?.direction || '';
  const action = play?.portfolio_action || '';
  const amount = play?.action_amount ?? 5;
  const quote = play?.reference_price ? `${money(play.reference_price)} · original call price` : 'Choose a stock to load the current price.';
  const goal = play
    ? (play.direction === 'flat' ? `End range ${money(play.target_low)}–${money(play.target_high)}` : `Goal ${money(play.target_price)}${play.direction === 'up' ? '+' : ' or lower'}`)
    : 'Choose a prediction to see the goal.';

  return `<form class="single-called-it-form" data-mode="${adminEdit ? 'admin-edit' : 'add'}" data-slot="${slotNumber}" ${play?.id ? `data-challenge-id="${escapeHtml(play.id)}"` : ''}>
    <div class="statement-line">
      <span class="statement-label">I think</span>
      <div class="ticker-search-wrap">
        <input class="ticker-search" name="ticker_search" value="${escapeHtml(ticker ? `${ticker} · ${company}` : '')}" autocomplete="off" placeholder="Search ticker or company" required>
        <input type="hidden" name="ticker" value="${escapeHtml(ticker)}">
        <div class="ticker-results" hidden></div>
      </div>
    </div>
    <div class="statement-line"><span class="statement-label">Currently trading at</span><div class="quote-preview" data-single-quote>${quote}</div></div>
    <div class="statement-line">
      <span class="statement-label">Will</span>
      <div class="prediction-choices">${predictionButtons(direction)}</div>
      <input type="hidden" name="direction" value="${escapeHtml(direction)}">
      <div class="goal-preview" data-single-goal>${escapeHtml(goal)}</div>
    </div>
    <label class="because-field"><span class="statement-label">Because</span><textarea name="reason" maxlength="4000" required placeholder="What did you find? Why do you think the stock will do this? Add links if you used them.">${escapeHtml(play?.reason || '')}</textarea></label>
    <div class="statement-line"><span class="statement-label">So I am</span><select name="portfolio_action" ${direction ? '' : 'disabled'}>${actionOptions(direction, action)}</select><div class="amount-wrap"><span>$</span><input name="action_amount" type="number" min="5" step="0.01" value="${escapeHtml(amount)}"></div></div>
    ${adminEdit ? '<div class="calc-note">Changing the ticker or prediction restarts the challenge at a fresh market price.</div>' : ''}
    <div class="single-form-actions"><button class="button button-primary" type="submit">${adminEdit ? 'Save Changes' : 'Save Challenge'}</button>${play ? '<button class="button button-danger" type="button" data-single-cancel>Cancel Challenge</button>' : ''}</div>
  </form>`;
}

export function ownerEditFormMarkup(play) {
  return `<form class="single-called-it-form" data-mode="owner-edit" data-challenge-id="${escapeHtml(play.id)}">
    <div class="called-it-static"><strong>${escapeHtml(play.ticker)}</strong><span>${escapeHtml(play.company_name || '')}</span></div>
    <div class="called-it-static"><strong>${escapeHtml(directionLabel(play.direction))}</strong><span>From ${money(play.reference_price)} · ${play.direction === 'flat' ? `${money(play.target_low)}–${money(play.target_high)}` : money(play.target_price)}</span></div>
    <div class="locked-call-note">The stock and prediction are locked after the call is made. You can still fix your explanation or what you plan to do.</div>
    <label class="because-field"><span class="statement-label">Because</span><textarea name="reason" maxlength="4000" required>${escapeHtml(play.reason || '')}</textarea></label>
    <div class="statement-line"><span class="statement-label">So I am</span><select name="portfolio_action">${actionOptions(play.direction, play.portfolio_action)}</select><div class="amount-wrap"><span>$</span><input name="action_amount" type="number" min="5" step="0.01" value="${escapeHtml(play.action_amount ?? 5)}"></div></div>
    <div class="single-form-actions"><button class="button button-primary" type="submit">Save Changes</button><button class="button button-danger" type="button" data-single-cancel>Cancel Challenge</button></div>
  </form>`;
}
