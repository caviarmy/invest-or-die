export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export function money(value) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return '—';
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

function slipDirectionLabel(direction) {
  if (direction === 'up') return '📈 GOES UP';
  if (direction === 'down') return '📉 GOES DOWN';
  if (direction === 'flat') return '→ FINISHES ABOUT THE SAME';
  return 'PREDICTION';
}

export function actionLabel(play) {
  const hasAmount = play?.action_amount !== null && play?.action_amount !== undefined && play?.action_amount !== '';
  const amount = hasAmount ? money(play.action_amount) : '—';
  if (play?.portfolio_action === 'buy') return `Buying ${amount}`;
  if (play?.portfolio_action === 'hold') return `Holding ${amount}`;
  if (play?.portfolio_action === 'sell') return `Selling ${amount}`;
  if (play?.portfolio_action === 'not_buying') return 'Not Buying';
  return '—';
}

export function goalLabel(play) {
  if (!play) return '';
  if (play.direction === 'up') {
    const target = money(play.target_price);
    return target === '—' ? '—' : `${target}+`;
  }
  if (play.direction === 'down') {
    const target = money(play.target_price);
    return target === '—' ? '—' : `${target} or lower`;
  }
  if (play.direction === 'flat') {
    const low = money(play.target_low);
    const high = money(play.target_high);
    return low === '—' || high === '—' ? '—' : `${low}–${high}`;
  }
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
  const slipNumber = String(slotNumber).padStart(2, '0');

  if (!play) {
    return `<div class="play-slot empty-slot">
      <div class="slot-label">CALL SLIP ${slipNumber}</div>
      <b>EMPTY — NO CALL FILED</b>
      <span>${canManage ? 'Use the add control above to file the next prediction.' : 'No active challenge in this slot.'}</span>
    </div>`;
  }

  const cooldown = cooldownRemaining(play.lock_until);
  if (['approved', 'rejected'].includes(play.status) && cooldown) {
    return `<div class="play-slot cooldown-slot">
      <div class="slot-label">CALL SLIP ${slipNumber}</div>
      <div class="review-badge">REVIEW COOLDOWN</div>
      <b>${cooldown} remaining</b>
      <span>Your next challenge can use this slot when the cooldown ends.</span>
    </div>`;
  }

  const qualified = targetMetFromLastCheck(play);
  const review = play.status === 'under_review';
  const hasCheckedPrice = play.last_checked_price !== null && play.last_checked_price !== undefined && play.last_checked_price !== '' && Boolean(play.last_checked_at);
  const lastCheck = hasCheckedPrice ? `<div><span>LAST CHECK</span><b>${money(play.last_checked_price)}</b></div>` : '';
  const checkedAt = play.last_checked_at ? `<div><span>CHECKED AT</span><b>${formatDateTime(play.last_checked_at)}</b></div>` : '';
  const buttons = review ? '' : canManage ? `
    <button class="button button-secondary challenge-action" type="button" data-check-id="${escapeHtml(play.id)}">Check Price</button>
    ${qualified ? `<button class="button button-primary challenge-action" type="button" data-submit-id="${escapeHtml(play.id)}">Submit for Review</button>` : ''}` : '';
  const editButton = canEdit && play.status === 'active'
    ? `<button class="play-edit-pencil" type="button" data-play-edit-id="${escapeHtml(play.id)}" aria-label="Edit this Called It challenge" title="Edit challenge">✎</button>`
    : '';

  return `<div class="play-slot ${review ? 'play-slot-review' : ''}">
    ${editButton}
    <div class="slot-label">CALL SLIP ${slipNumber}</div>
    <div class="play-ticker">${escapeHtml(play.ticker)}</div>
    <div class="play-company">${escapeHtml(play.company_name || '')}</div>
    <div class="prediction-badge prediction-${escapeHtml(play.direction || 'unknown')}">${slipDirectionLabel(play.direction)}</div>
    <div class="play-meta">
      <div><span>OPENED</span><b>${money(play.reference_price)}</b></div>
      <div><span>TARGET</span><b>${escapeHtml(goalLabel(play))}</b></div>
      ${lastCheck}${checkedAt}
    </div>
    <div class="play-copy reason-copy"><strong>BECAUSE</strong><div>${linkifyPlainText(play.reason || '')}</div></div>
    <div class="play-copy"><strong>MY MOVE</strong><div>${escapeHtml(actionLabel(play))}</div></div>
    <div class="play-expiry">${play.direction === 'flat' ? 'ENDS' : 'EXPIRES'} / ${formatDate(play.expires_at)}</div>
    ${qualified && !review ? `<div class="target-reached"><strong>GOAL MET AT LAST CHECK</strong><span>${money(play.last_checked_price)} · checked ${formatDateTime(play.last_checked_at)} · submission will recheck the price</span></div>` : ''}
    ${review ? `<div class="under-review-box"><strong>UNDER REVIEW</strong><span>Submitted at ${money(play.qualifying_price)}</span><span>Slot locked for ${cooldownRemaining(play.lock_until) || 'review'}</span></div>` : ''}
    ${buttons ? `<div class="challenge-actions">${buttons}</div>` : ''}
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
    ? (play.direction === 'flat' ? `End range ${goalLabel(play)}` : `Goal ${goalLabel(play)}`)
    : 'Choose a prediction to see the goal.';
  const quoteLabel = adminEdit ? 'Price basis' : 'Currently trading at';
  const prefix = adminEdit ? 'called-admin' : 'called-add';
  const modeLabel = adminEdit ? 'ADMIN REFILE' : 'NEW CALL';

  return `<form class="single-called-it-form" data-mode="${adminEdit ? 'admin-edit' : 'add'}" data-slot="${slotNumber}" ${play?.id ? `data-challenge-id="${escapeHtml(play.id)}"` : ''}>
    <div class="call-form-register"><span>CALL WORKSHEET / SLIP ${String(slotNumber).padStart(2, '0')}</span><span>${modeLabel}</span></div>
    <div class="call-form-row">
      <label class="statement-label" for="${prefix}-ticker-search">I think</label>
      <div class="ticker-search-wrap">
        <input id="${prefix}-ticker-search" class="ticker-search" name="ticker_search" value="${escapeHtml(ticker ? `${ticker} · ${company}` : '')}" autocomplete="off" placeholder="Search ticker or company" aria-controls="${prefix}-ticker-results" required>
        <input type="hidden" name="ticker" value="${escapeHtml(ticker)}">
        <div id="${prefix}-ticker-results" class="ticker-results" hidden></div>
      </div>
    </div>
    <div class="call-form-row price-row">
      <span id="${prefix}-quote-label" class="statement-label">${quoteLabel}</span>
      <output class="quote-preview" data-single-quote aria-labelledby="${prefix}-quote-label" aria-live="polite">${quote}</output>
    </div>
    <fieldset class="call-form-row direction-row">
      <legend class="statement-label">Will</legend>
      <div class="prediction-choices">${predictionButtons(direction)}</div>
      <input type="hidden" name="direction" value="${escapeHtml(direction)}">
      <output class="goal-preview" data-single-goal aria-live="polite">${escapeHtml(goal)}</output>
    </fieldset>
    <div class="call-form-row because-field">
      <label class="statement-label" for="${prefix}-reason">Because</label>
      <textarea id="${prefix}-reason" name="reason" maxlength="4000" required placeholder="What did you find? Why do you think the stock will do this? Add links if you used them.">${escapeHtml(play?.reason || '')}</textarea>
    </div>
    <div class="call-form-row action-row">
      <label class="statement-label" for="${prefix}-action">So I am</label>
      <div class="action-controls">
        <select id="${prefix}-action" name="portfolio_action" ${direction ? '' : 'disabled'}>${actionOptions(direction, action)}</select>
        <label class="amount-wrap" for="${prefix}-amount"><span aria-hidden="true">$</span><span class="sr-only">Amount</span><input id="${prefix}-amount" name="action_amount" type="number" min="5" step="0.01" value="${escapeHtml(amount)}"></label>
      </div>
    </div>
    ${adminEdit ? '<div class="calc-note">Changing the ticker or prediction restarts the challenge at a fresh market price.</div>' : ''}
    <div class="single-form-actions"><button class="button button-primary" type="submit">${adminEdit ? 'Save Changes' : 'File This Call'}</button>${play ? '<button class="button button-danger" type="button" data-single-cancel>Cancel Challenge</button>' : ''}</div>
  </form>`;
}

export function ownerEditFormMarkup(play) {
  const prefix = 'called-owner';
  const target = goalLabel(play);

  return `<form class="single-called-it-form owner-edit-form" data-mode="owner-edit" data-challenge-id="${escapeHtml(play.id)}">
    <div class="call-form-register"><span>CALL WORKSHEET / SLIP ${String(play.slot_number || 1).padStart(2, '0')}</span><span>OWNER CORRECTION</span></div>
    <div class="called-it-static call-static-row"><span class="static-label">STOCK</span><strong>${escapeHtml(play.ticker)}</strong><span>${escapeHtml(play.company_name || '')}</span></div>
    <div class="called-it-static call-static-row"><span class="static-label">LOCKED CALL</span><strong>${escapeHtml(directionLabel(play.direction))}</strong><span>From ${money(play.reference_price)} · target ${target}</span></div>
    <div class="locked-call-note">The stock and prediction are locked after the call is made. You can still fix your explanation or what you plan to do.</div>
    <div class="call-form-row because-field">
      <label class="statement-label" for="${prefix}-reason">Because</label>
      <textarea id="${prefix}-reason" name="reason" maxlength="4000" required>${escapeHtml(play.reason || '')}</textarea>
    </div>
    <div class="call-form-row action-row">
      <label class="statement-label" for="${prefix}-action">So I am</label>
      <div class="action-controls">
        <select id="${prefix}-action" name="portfolio_action">${actionOptions(play.direction, play.portfolio_action)}</select>
        <label class="amount-wrap" for="${prefix}-amount"><span aria-hidden="true">$</span><span class="sr-only">Amount</span><input id="${prefix}-amount" name="action_amount" type="number" min="5" step="0.01" value="${escapeHtml(play.action_amount ?? 5)}"></label>
      </div>
    </div>
    <div class="single-form-actions"><button class="button button-primary" type="submit">Save Changes</button><button class="button button-danger" type="button" data-single-cancel>Cancel Challenge</button></div>
  </form>`;
}
