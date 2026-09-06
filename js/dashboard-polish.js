import { getSessionState } from './auth.js';
import {
  adminEditCalledIt,
  cancelCalledIt,
  createCalledIt,
  previewCalledIt,
  searchSecurities
} from './market.js';
import { directionLabel, escapeHtml, goalPreview, money, tickerResultMarkup } from './called-it-ui.js';

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

const editModal = document.getElementById('editModal');
const editTitle = document.getElementById('editTitle');
const editSlots = document.getElementById('editSlots');
const editMessage = document.getElementById('editMessage');
const addButton = document.getElementById('editMyPlaysButton');
const participantsGrid = document.getElementById('participantsGrid');
const historyTableBody = document.getElementById('historyTableBody');

let sessionState = null;
let settingsCache = null;
let historyDecorationTimer = null;
let addButtonSyncTimer = null;

async function session() {
  sessionState = await getSessionState();
  return sessionState;
}

function openSingleModal(title, markup) {
  editTitle.textContent = title;
  editSlots.innerHTML = markup;
  editMessage.className = 'form-message';
  editMessage.textContent = '';
  editModal.classList.add('single-play-mode', 'open');
  editModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeSingleModal() {
  editModal.classList.remove('single-play-mode', 'open');
  editModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showError(message) {
  editMessage.className = 'form-message error';
  editMessage.textContent = message || 'Could not update the challenge.';
}

function actionOptions(direction, selected = '') {
  const choices = ACTIONS[direction] || [];
  if (!choices.length) return '<option value="">Choose a prediction first</option>';
  const selectedAllowed = choices.some(([value]) => value === selected) ? selected : choices[0][0];
  return choices.map(([value, label]) => `<option value="${value}" ${value === selectedAllowed ? 'selected' : ''}>${label}</option>`).join('');
}

function predictionButtons(direction = '', disabled = false) {
  const defs = [
    ['up', 'Go Up'],
    ['down', 'Go Down'],
    ['flat', 'Finish About the Same']
  ];
  return defs.map(([value, label]) => `<button type="button" data-single-direction="${value}" class="prediction-choice ${direction === value ? 'selected' : ''}" ${disabled ? 'disabled' : ''}>${label}</button>`).join('');
}

async function loadSettings(client) {
  if (settingsCache) return settingsCache;
  const { data, error } = await client
    .from('game_settings')
    .select('called_it_up_percent,called_it_down_percent,called_it_flat_percent')
    .eq('id', 'main')
    .maybeSingle();
  if (error) throw error;
  settingsCache = {
    up: Number(data?.called_it_up_percent ?? 15),
    down: Number(data?.called_it_down_percent ?? 15),
    flat: Number(data?.called_it_flat_percent ?? 3)
  };
  return settingsCache;
}

function fullFormMarkup({ play = null, slotNumber = 1, adminEdit = false }) {
  const ticker = play?.ticker || '';
  const company = play?.company_name || '';
  const direction = play?.direction || '';
  const action = play?.portfolio_action || '';
  const amount = play?.action_amount ?? 5;
  return `<form class="single-called-it-form" data-mode="${adminEdit ? 'admin-edit' : 'add'}" data-slot="${slotNumber}" ${play?.id ? `data-challenge-id="${escapeHtml(play.id)}"` : ''}>
    <div class="statement-line">
      <span class="statement-label">I think</span>
      <div class="ticker-search-wrap">
        <input class="ticker-search" name="ticker_search" value="${escapeHtml(ticker ? `${ticker} · ${company}` : '')}" autocomplete="off" placeholder="Search ticker or company" required>
        <input type="hidden" name="ticker" value="${escapeHtml(ticker)}">
        <div class="ticker-results" hidden></div>
      </div>
    </div>
    <div class="statement-line"><span class="statement-label">Currently trading at</span><div class="quote-preview" data-single-quote>${play?.reference_price ? `${money(play.reference_price)} · original call price` : 'Choose a stock to load the current price.'}</div></div>
    <div class="statement-line">
      <span class="statement-label">Will</span>
      <div class="prediction-choices">${predictionButtons(direction)}</div>
      <input type="hidden" name="direction" value="${escapeHtml(direction)}">
      <div class="goal-preview" data-single-goal>${play ? escapeHtml(play.direction === 'flat' ? `End range ${money(play.target_low)}–${money(play.target_high)}` : `Goal ${money(play.target_price)}${play.direction === 'up' ? '+' : ' or lower'}`) : 'Choose a prediction to see the goal.'}</div>
    </div>
    <label class="because-field"><span class="statement-label">Because</span><textarea name="reason" maxlength="4000" required placeholder="What did you find? Why do you think the stock will do this? Add links if you used them.">${escapeHtml(play?.reason || '')}</textarea></label>
    <div class="statement-line"><span class="statement-label">So I am</span><select name="portfolio_action" ${direction ? '' : 'disabled'}>${actionOptions(direction, action)}</select><div class="amount-wrap"><span>$</span><input name="action_amount" type="number" min="5" step="0.01" value="${escapeHtml(amount)}"></div></div>
    ${adminEdit ? '<div class="calc-note">Changing the ticker or prediction restarts the challenge at a fresh market price.</div>' : ''}
    <div class="single-form-actions"><button class="button button-primary" type="submit">${adminEdit ? 'Save Changes' : 'Save Challenge'}</button>${play ? '<button class="button button-danger" type="button" data-single-cancel>Cancel Challenge</button>' : ''}</div>
  </form>`;
}

function ownerEditMarkup(play) {
  return `<form class="single-called-it-form" data-mode="owner-edit" data-challenge-id="${escapeHtml(play.id)}">
    <div class="called-it-static"><strong>${escapeHtml(play.ticker)}</strong><span>${escapeHtml(play.company_name || '')}</span></div>
    <div class="called-it-static"><strong>${escapeHtml(directionLabel(play.direction))}</strong><span>From ${money(play.reference_price)} · ${play.direction === 'flat' ? `${money(play.target_low)}–${money(play.target_high)}` : money(play.target_price)}</span></div>
    <div class="locked-call-note">The stock and prediction are locked after the call is made. You can still fix your explanation or what you plan to do.</div>
    <label class="because-field"><span class="statement-label">Because</span><textarea name="reason" maxlength="4000" required>${escapeHtml(play.reason || '')}</textarea></label>
    <div class="statement-line"><span class="statement-label">So I am</span><select name="portfolio_action">${actionOptions(play.direction, play.portfolio_action)}</select><div class="amount-wrap"><span>$</span><input name="action_amount" type="number" min="5" step="0.01" value="${escapeHtml(play.action_amount ?? 5)}"></div></div>
    <div class="single-form-actions"><button class="button button-primary" type="submit">Save Changes</button><button class="button button-danger" type="button" data-single-cancel>Cancel Challenge</button></div>
  </form>`;
}

function syncAmount(form) {
  const select = form.elements.portfolio_action;
  const wrap = form.querySelector('.amount-wrap');
  if (!select || !wrap) return;
  const hidden = select.value === 'not_buying' || !select.value;
  wrap.hidden = hidden;
  if (form.elements.action_amount) form.elements.action_amount.required = !hidden;
}

async function syncGoal(form) {
  const goal = form.querySelector('[data-single-goal]');
  if (!goal) return;
  const direction = form.elements.direction?.value || '';
  const raw = form.dataset.previewPrice || form.dataset.referencePrice || '';
  const price = Number(raw);
  const state = await session();
  const settings = await loadSettings(state.client);
  goal.textContent = goalPreview(price, direction, settings);
}

function syncActionForDirection(form) {
  const direction = form.elements.direction?.value || '';
  const select = form.elements.portfolio_action;
  if (!select) return;
  const previous = select.value;
  select.innerHTML = actionOptions(direction, previous);
  select.disabled = !direction;
  syncAmount(form);
}

function bindTickerSearch(form) {
  const input = form.elements.ticker_search;
  const hidden = form.elements.ticker;
  const results = form.querySelector('.ticker-results');
  const quote = form.querySelector('[data-single-quote]');
  if (!input || !hidden || !results || !quote) return;
  let timer = null;
  let seq = 0;

  input.addEventListener('input', () => {
    hidden.value = '';
    form.dataset.previewPrice = '';
    quote.textContent = 'Choose a stock to load the current price.';
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) {
      results.hidden = true;
      results.innerHTML = '';
      return;
    }
    const current = ++seq;
    timer = setTimeout(async () => {
      try {
        const state = await session();
        const rows = await searchSecurities(state.client, q, 10);
        if (current !== seq) return;
        results.innerHTML = rows.length ? rows.map(tickerResultMarkup).join('') : '<div class="ticker-no-results">No matching listed stocks.</div>';
        results.hidden = false;
      } catch (error) {
        if (current !== seq) return;
        results.innerHTML = `<div class="ticker-no-results">${escapeHtml(error.message || 'Could not search stocks.')}</div>`;
        results.hidden = false;
      }
    }, 180);
  });

  results.addEventListener('click', async event => {
    const button = event.target.closest('[data-ticker]');
    if (!button) return;
    hidden.value = button.dataset.ticker;
    input.value = `${button.dataset.ticker} · ${button.dataset.company}`;
    results.hidden = true;
    quote.textContent = 'Loading current price…';
    try {
      const state = await session();
      const response = await previewCalledIt(state.client, button.dataset.ticker);
      form.dataset.previewPrice = String(response.quote.price);
      quote.textContent = `${money(response.quote.price)} · ${response.quote.market_status === 'open' ? 'market open' : 'latest price'}`;
      await syncGoal(form);
    } catch (error) {
      quote.textContent = error.message || 'Current price is unavailable.';
    }
  });
}

function bindSingleForm(form, play = null) {
  if (play?.reference_price) form.dataset.referencePrice = String(play.reference_price);
  bindTickerSearch(form);
  syncActionForDirection(form);
  syncAmount(form);

  form.querySelectorAll('[data-single-direction]').forEach(button => {
    button.addEventListener('click', async () => {
      form.elements.direction.value = button.dataset.singleDirection;
      form.querySelectorAll('[data-single-direction]').forEach(item => item.classList.toggle('selected', item === button));
      syncActionForDirection(form);
      await syncGoal(form);
    });
  });

  form.elements.portfolio_action?.addEventListener('change', () => syncAmount(form));

  form.querySelector('[data-single-cancel]')?.addEventListener('click', async () => {
    if (!play?.id || !confirm('Cancel this challenge? It will not pay and the active challenge will close.')) return;
    try {
      const state = await session();
      await cancelCalledIt(state.client, play.id);
      closeSingleModal();
      window.location.reload();
    } catch (error) {
      showError(error.message);
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    try {
      submit.disabled = true;
      editMessage.className = 'form-message';
      editMessage.textContent = 'Saving…';
      const state = await session();
      const mode = form.dataset.mode;
      const action = form.elements.portfolio_action.value;
      const amount = action === 'not_buying' ? null : Number(form.elements.action_amount.value);

      if (mode === 'owner-edit') {
        const { error } = await state.client.rpc('edit_own_called_it_metadata', {
          challenge_id: form.dataset.challengeId,
          new_reason: form.elements.reason.value,
          new_portfolio_action: action,
          new_action_amount: amount
        });
        if (error) throw error;
      } else {
        const ticker = form.elements.ticker.value;
        const direction = form.elements.direction.value;
        if (!ticker) throw new Error('Choose a stock from the search results.');
        if (!direction) throw new Error('Choose Go Up, Go Down, or Finish About the Same.');
        const payload = {
          owner_id: play?.owner_id || form.dataset.ownerId || state.user.id,
          slot_number: Number(form.dataset.slot),
          ticker,
          direction,
          reason: form.elements.reason.value,
          portfolio_action: action,
          action_amount: amount
        };
        if (mode === 'admin-edit') await adminEditCalledIt(state.client, form.dataset.challengeId, payload);
        else await createCalledIt(state.client, payload);
      }

      closeSingleModal();
      window.location.reload();
    } catch (error) {
      showError(error.message);
      submit.disabled = false;
    }
  });
}

async function getPlay(challengeId) {
  const state = await session();
  const { data, error } = await state.client
    .from('called_it_plays')
    .select('id,owner_id,slot_number,ticker,company_name,exchange,reference_price,reference_price_at,direction,target_price,target_low,target_high,reason,portfolio_action,action_amount,status,lock_until')
    .eq('id', challengeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Challenge not found.');
  return { state, play: data };
}

async function openPlayEditor(challengeId) {
  try {
    const { state, play } = await getPlay(challengeId);
    if (play.status !== 'active') throw new Error('Only an active challenge can be edited.');
    if (!state.profile?.is_admin && play.owner_id !== state.user?.id) throw new Error('You can only edit your own challenge.');
    const adminMode = Boolean(state.profile?.is_admin);
    openSingleModal(`Edit ${play.ticker}`, adminMode ? fullFormMarkup({ play, slotNumber: play.slot_number, adminEdit: true }) : ownerEditMarkup(play));
    bindSingleForm(editSlots.querySelector('.single-called-it-form'), play);
  } catch (error) {
    openSingleModal('Called It challenge', `<div class="called-it-static"><strong>Could not open challenge</strong><span>${escapeHtml(error.message || 'Unknown error')}</span></div>`);
  }
}

async function slotAvailability(ownerId) {
  const state = await session();
  const { data, error } = await state.client
    .from('called_it_plays')
    .select('slot_number,status,lock_until,created_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const now = Date.now();
  const blocked = new Set();
  for (const row of data || []) {
    const slot = Number(row.slot_number);
    if (![1, 2].includes(slot)) continue;
    if (['active', 'under_review'].includes(row.status)) blocked.add(slot);
    if (['approved', 'rejected'].includes(row.status) && row.lock_until && new Date(row.lock_until).getTime() > now) blocked.add(slot);
  }
  return [1, 2].find(slot => !blocked.has(slot)) || null;
}

async function openAddForOwner(ownerId) {
  try {
    const state = await session();
    if (!state.user) throw new Error('Sign in to create a challenge.');
    if (ownerId !== state.user.id && !state.profile?.is_admin) throw new Error('Admin access is required.');
    const slot = await slotAvailability(ownerId);
    if (!slot) {
      openSingleModal('Add Called It challenge', '<div class="called-it-static"><strong>Both slots are unavailable</strong><span>Both challenge slots are active, under review, or in cooldown.</span></div>');
      return;
    }
    const { data: owner } = await state.client.from('participants').select('display_name').eq('user_id', ownerId).maybeSingle();
    openSingleModal(ownerId === state.user.id ? `Add Challenge ${slot}` : `Add ${owner?.display_name || 'participant'} Challenge ${slot}`, fullFormMarkup({ slotNumber: slot }));
    const form = editSlots.querySelector('.single-called-it-form');
    form.dataset.ownerId = ownerId;
    bindSingleForm(form);
  } catch (error) {
    openSingleModal('Add Called It challenge', `<div class="called-it-static"><strong>Could not add challenge</strong><span>${escapeHtml(error.message || 'Unknown error')}</span></div>`);
  }
}

function decoratePlayCards() {
  document.querySelectorAll('.play-slot').forEach(card => {
    if (card.querySelector('.play-edit-pencil')) return;
    const source = card.querySelector('[data-check-id]') || card.querySelector('[data-admin-edit-id]');
    const challengeId = source?.dataset.checkId || source?.dataset.adminEditId;
    if (!challengeId) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'play-edit-pencil';
    button.dataset.playEditId = challengeId;
    button.setAttribute('aria-label', 'Edit this Called It challenge');
    button.title = 'Edit challenge';
    button.textContent = '✎';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openPlayEditor(challengeId);
    });
    card.prepend(button);
  });

  document.querySelectorAll('.admin-edit-button').forEach(button => {
    button.textContent = '+ Add';
    button.title = 'Add a challenge for this participant';
  });
}

function narrowLegacyForm(form) {
  if (!form?.elements?.portfolio_action || !form.elements.direction) return;
  const direction = form.elements.direction.value;
  const current = form.elements.portfolio_action.value;
  form.elements.portfolio_action.innerHTML = actionOptions(direction, current);
  form.elements.portfolio_action.disabled = !direction;
  const wrap = form.querySelector('.amount-wrap');
  if (wrap) wrap.hidden = form.elements.portfolio_action.value === 'not_buying' || !form.elements.portfolio_action.value;
}

function narrowLegacyForms() {
  document.querySelectorAll('.called-it-form').forEach(form => narrowLegacyForm(form));
}

async function decorateHistory() {
  clearTimeout(historyDecorationTimer);
  historyDecorationTimer = setTimeout(async () => {
    try {
      const state = await session();
      if (!state.profile?.is_admin || !historyTableBody) return;
      const rows = [...historyTableBody.querySelectorAll('tr')].filter(row => row.children.length > 1);
      if (!rows.length) return;
      const { data, error } = await state.client
        .from('results_history')
        .select('id,event_date,created_at')
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      rows.forEach((row, index) => {
        const history = data?.[index];
        if (!history || row.querySelector('.history-delete-button')) return;
        row.dataset.historyId = history.id;
        const statusCell = row.children[4] || row.lastElementChild;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'history-delete-button';
        button.textContent = 'Delete row';
        button.addEventListener('click', async () => {
          if (!confirm('Delete this history row? This is intended for testing/debug cleanup.')) return;
          button.disabled = true;
          const fresh = await session();
          const { error: deleteError } = await fresh.client.from('results_history').delete().eq('id', history.id);
          if (deleteError) {
            button.disabled = false;
            alert(deleteError.message || 'Could not delete history row.');
            return;
          }
          window.location.reload();
        });
        statusCell.appendChild(button);
      });
    } catch (error) {
      console.error('History admin decoration failed', error);
    }
  }, 80);
}

async function syncOwnAddButton() {
  clearTimeout(addButtonSyncTimer);
  addButtonSyncTimer = setTimeout(async () => {
    if (!addButton) return;
    try {
      const state = await session();
      if (!state.user || !state.profile?.active) return;
      const slot = await slotAvailability(state.user.id);
      addButton.textContent = slot ? 'Add Challenge' : 'Challenge Slots Full';
      addButton.disabled = !slot;
    } catch {
      addButton.textContent = 'Add Challenge';
    }
  }, 100);
}

if (addButton) {
  addButton.textContent = 'Add Challenge';
  addButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    session().then(state => {
      if (state.user) openAddForOwner(state.user.id);
    }).catch(error => showError(error.message));
  }, true);
}

document.addEventListener('click', event => {
  const adminAdd = event.target.closest('.admin-edit-button');
  if (adminAdd) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openAddForOwner(adminAdd.dataset.editOwner);
    return;
  }
  const legacyDirection = event.target.closest('.called-it-form [data-direction]');
  if (legacyDirection) setTimeout(() => narrowLegacyForm(legacyDirection.closest('.called-it-form')), 0);
}, true);

editModal?.querySelector('[data-close-modal]')?.addEventListener('click', () => editModal.classList.remove('single-play-mode'));

const participantsObserver = participantsGrid ? new MutationObserver(() => {
  decoratePlayCards();
  syncOwnAddButton();
}) : null;
participantsObserver?.observe(participantsGrid, { childList: true, subtree: true });

const editObserver = editSlots ? new MutationObserver(() => narrowLegacyForms()) : null;
editObserver?.observe(editSlots, { childList: true, subtree: true });

const historyObserver = historyTableBody ? new MutationObserver(() => decorateHistory()) : null;
historyObserver?.observe(historyTableBody, { childList: true, subtree: true });

decoratePlayCards();
narrowLegacyForms();
decorateHistory();
syncOwnAddButton();
