import { backendIsConfigured, getSessionState, signIn, signOut } from './auth.js';
import { fallbackDashboardData, getOwnerSlots, loadDashboardData, saveWeeklyWinner, saveGameSettings } from './plays.js';
import { adminEditCalledIt, cancelCalledIt, checkCalledIt, createCalledIt, previewCalledIt, resetCalledItCooldown, reviewCalledIt, searchSecurities, submitCalledIt } from './market.js';
import {
  actionOptions,
  challengeCardMarkup,
  cooldownRemaining,
  directionLabel,
  escapeHtml,
  formatDate,
  goalLabel,
  goalPreview,
  money,
  ownerEditFormMarkup,
  singleChallengeFormMarkup,
  tickerResultMarkup
} from './called-it-ui.js';

const state = {
  session: { configured: false, client: null, user: null, profile: null },
  data: fallbackDashboardData()
};

const els = {
  authButton: document.getElementById('authButton'),
  accountLabel: document.getElementById('accountLabel'),
  editMyPlaysButton: document.getElementById('editMyPlaysButton'),
  adminWeekButton: document.getElementById('adminWeekButton'),
  participantsGrid: document.getElementById('participantsGrid'),
  dashboardStatus: document.getElementById('dashboardStatus'),
  winnerContent: document.getElementById('winnerContent'),
  winnerChartWrap: document.getElementById('winnerChartWrap'),
  winnerChart: document.getElementById('winnerChart'),
  currentWeekValue: document.getElementById('currentWeekValue'),
  purchaseMinimumValue: document.getElementById('purchaseMinimumValue'),
  purchaseMinimumNote: document.getElementById('purchaseMinimumNote'),
  weeklyLeaderName: document.getElementById('weeklyLeaderName'),
  weeklyLeaderCount: document.getElementById('weeklyLeaderCount'),
  calledLeaderName: document.getElementById('calledLeaderName'),
  calledLeaderCount: document.getElementById('calledLeaderCount'),
  historyTableBody: document.getElementById('historyTableBody'),
  authModal: document.getElementById('authModal'),
  authForm: document.getElementById('authForm'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authMessage: document.getElementById('authMessage'),
  editModal: document.getElementById('editModal'),
  editTitle: document.getElementById('editTitle'),
  editSlots: document.getElementById('editSlots'),
  editMessage: document.getElementById('editMessage'),
  weekModal: document.getElementById('weekModal'),
  weekForm: document.getElementById('weekForm'),
  weekMessage: document.getElementById('weekMessage'),
  winnerNameInput: document.getElementById('winnerNameInput'),
  winnerReturnInput: document.getElementById('winnerReturnInput'),
  currentWeekInput: document.getElementById('currentWeekInput'),
  weekStartInput: document.getElementById('weekStartInput'),
  weekEndInput: document.getElementById('weekEndInput'),
  winnerChartInput: document.getElementById('winnerChartInput'),
  calledUpInput: document.getElementById('calledUpInput'),
  calledDownInput: document.getElementById('calledDownInput'),
  calledFlatInput: document.getElementById('calledFlatInput'),
  calledDurationInput: document.getElementById('calledDurationInput'),
  calledCooldownInput: document.getElementById('calledCooldownInput'),
  calledClaimInput: document.getElementById('calledClaimInput'),
  calledPayoutInput: document.getElementById('calledPayoutInput')
};

let modalReturnFocus = null;

function renderTracker() {
  const week = Number(state.data.settings?.current_week) || 1;
  const weeklyMin = Number(state.data.settings?.weekly_stock_buy_min) || 5;
  const total = week * weeklyMin;
  els.currentWeekValue.textContent = `Week ${week}`;
  els.purchaseMinimumValue.textContent = money(total);
  els.purchaseMinimumNote.textContent = `At least ${money(total)} of stock bought total (${money(weeklyMin)} × ${week} weeks). Current portfolio value does not matter.`;
}

function renderWinner() {
  const winner = state.data.winner;
  if (!winner) {
    els.winnerContent.innerHTML = '<div class="winner-name winner-empty">Winner not posted yet.</div><p class="muted">This week\'s result will show here after it is entered.</p>';
    els.winnerChartWrap.hidden = true;
    return;
  }

  const sign = Number(winner.return_percent) > 0 ? '+' : '';
  els.winnerContent.innerHTML = `
    <div class="winner-name">${escapeHtml(winner.winner_name)}</div>
    <div class="winner-return">${sign}${Number(winner.return_percent).toFixed(2)}%</div>
    <div class="winner-week">${formatDate(winner.week_start)} – ${formatDate(winner.week_end)}</div>`;

  if (winner.chart_url) {
    els.winnerChart.src = winner.chart_url;
    els.winnerChart.alt = `${winner.winner_name} weekly portfolio chart`;
    els.winnerChartWrap.hidden = false;
  } else {
    els.winnerChartWrap.hidden = true;
  }
}

function participantById(userId) {
  return state.data.participants.find(item => item.user_id === userId) || null;
}

function nextAvailableSlot(ownerId) {
  const slots = getOwnerSlots(state.data.plays, ownerId);
  const index = slots.findIndex(play => !play);
  return index >= 0 ? index + 1 : null;
}

async function runCardAction(button, action, workingText) {
  const original = button.textContent;
  try {
    button.disabled = true;
    button.textContent = workingText;
    await action();
    await refreshData();
  } catch (error) {
    els.dashboardStatus.textContent = error.message || 'Could not update the challenge.';
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function bindChallengeCardActions() {
  els.participantsGrid.querySelectorAll('[data-check-id]').forEach(button => {
    button.addEventListener('click', () => runCardAction(button, () => checkCalledIt(state.session.client, button.dataset.checkId), 'Checking…'));
  });

  els.participantsGrid.querySelectorAll('[data-submit-id]').forEach(button => {
    button.addEventListener('click', () => runCardAction(button, () => submitCalledIt(state.session.client, button.dataset.submitId), 'Rechecking…'));
  });

  els.participantsGrid.querySelectorAll('[data-play-edit-id]').forEach(button => {
    button.addEventListener('click', () => openPlayEditor(button.dataset.playEditId));
  });

  els.participantsGrid.querySelectorAll('[data-add-owner]').forEach(button => {
    button.addEventListener('click', () => openAddForOwner(button.dataset.addOwner));
  });
}

function renderParticipants() {
  const userId = state.session.user?.id || null;
  const isAdmin = Boolean(state.session.profile?.is_admin);

  els.participantsGrid.innerHTML = state.data.participants.map(participant => {
    const slots = getOwnerSlots(state.data.plays, participant.user_id);
    const isYou = Boolean(userId && participant.user_id === userId);
    const canManage = Boolean(state.session.user && (isYou || isAdmin));
    const adminSlot = isAdmin ? nextAvailableSlot(participant.user_id) : null;
    const participantName = escapeHtml(participant.display_name);
    const adminLabel = adminSlot
      ? `Add challenge for ${participant.display_name}`
      : `Challenge slots unavailable for ${participant.display_name}`;

    return `<article class="participant-card">
      <div class="participant-head">
        <h3 class="participant-name">${participantName}</h3>
        <div class="participant-actions">
          ${isYou ? '<span class="you-badge">YOU</span>' : ''}
          ${isAdmin ? `<button class="admin-edit-button" type="button" data-add-owner="${escapeHtml(participant.user_id)}" aria-label="${escapeHtml(adminLabel)}" ${adminSlot ? '' : 'disabled'} title="${adminSlot ? 'Add a challenge for this participant' : 'Both challenge slots are unavailable'}">+ Add</button>` : ''}
        </div>
      </div>
      <div class="slot-list">${challengeCardMarkup(slots[0], 1, { canManage, canEdit: canManage })}${challengeCardMarkup(slots[1], 2, { canManage, canEdit: canManage })}</div>
    </article>`;
  }).join('');

  bindChallengeCardActions();
}

function leaderFor(type) {
  const counts = new Map();
  state.data.history
    .filter(row => row.event_type === type && (type !== 'called_it' || row.status === 'approved'))
    .forEach(row => {
      const key = row.participant_name || 'Unknown';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

  if (!counts.size) return { name: 'No wins yet', count: 0 };
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const max = sorted[0][1];
  const leaders = sorted.filter(([, count]) => count === max).map(([name]) => name);
  return { name: leaders.join(' + '), count: max };
}

function calledHistoryDetails(row) {
  const direction = row.direction ? directionLabel(row.direction).toLowerCase() : 'prediction';
  const start = row.starting_price || row.call_price;
  const goal = row.direction === 'flat'
    ? `${money(row.target_low)}–${money(row.target_high)}`
    : money(row.target_price);
  const qualified = row.qualifying_price ? ` · submitted ${money(row.qualifying_price)}` : '';
  return `${escapeHtml(row.ticker || '')} · ${escapeHtml(direction)} · from ${money(start)} · goal ${goal}${qualified}`;
}

function historyAdminActions(row) {
  if (!state.session.profile?.is_admin) return '';

  const actions = [];
  if (row.event_type === 'called_it' && row.status === 'under_review') {
    actions.push(`<button type="button" data-review-id="${escapeHtml(row.source_id)}" data-decision="approved">Approve +${money(state.data.settings.called_it_payout)}</button>`);
    actions.push(`<button type="button" data-review-id="${escapeHtml(row.source_id)}" data-decision="rejected">Reject</button>`);
  } else if (row.event_type === 'called_it') {
    const play = state.data.plays.find(item => item.id === row.source_id);
    if (play && ['approved', 'rejected'].includes(row.status) && cooldownRemaining(play.lock_until)) {
      actions.push(`<button type="button" data-reset-id="${escapeHtml(row.source_id)}">Reset Cooldown</button>`);
    }
  }

  actions.push(`<button class="history-delete-button" type="button" data-history-delete-id="${escapeHtml(row.id)}">Delete row</button>`);
  return `<div class="history-actions">${actions.join('')}</div>`;
}

function bindHistoryActions() {
  els.historyTableBody.querySelectorAll('[data-review-id]').forEach(button => {
    button.addEventListener('click', async () => {
      const decision = button.dataset.decision;
      const verb = decision === 'approved' ? 'approve' : 'reject';
      if (!confirm(`${verb[0].toUpperCase()}${verb.slice(1)} this Called It challenge?`)) return;
      const original = button.textContent;
      try {
        button.disabled = true;
        button.textContent = 'Saving…';
        await reviewCalledIt(state.session.client, button.dataset.reviewId, decision);
        await refreshData();
      } catch (error) {
        els.dashboardStatus.textContent = error.message || 'Could not review the challenge.';
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    });
  });

  els.historyTableBody.querySelectorAll('[data-reset-id]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Reset this slot cooldown now?')) return;
      try {
        button.disabled = true;
        await resetCalledItCooldown(state.session.client, button.dataset.resetId);
        await refreshData();
      } catch (error) {
        els.dashboardStatus.textContent = error.message || 'Could not reset the cooldown.';
      }
    });
  });

  els.historyTableBody.querySelectorAll('[data-history-delete-id]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this history row? This is intended for testing/debug cleanup.')) return;
      try {
        button.disabled = true;
        const { error } = await state.session.client
          .from('results_history')
          .delete()
          .eq('id', button.dataset.historyDeleteId);
        if (error) throw error;
        await refreshData();
      } catch (error) {
        button.disabled = false;
        els.dashboardStatus.textContent = error.message || 'Could not delete the history row.';
      }
    });
  });
}

function renderHistory() {
  const weekly = leaderFor('weekly_win');
  const called = leaderFor('called_it');
  els.weeklyLeaderName.textContent = weekly.name;
  els.weeklyLeaderCount.textContent = `${weekly.count} ${weekly.count === 1 ? 'win' : 'wins'}`;
  els.calledLeaderName.textContent = called.name;
  els.calledLeaderCount.textContent = `${called.count} ${called.count === 1 ? 'win' : 'wins'}`;

  if (!state.data.history.length) {
    els.historyTableBody.innerHTML = '<tr><td colspan="6" class="history-empty">No results recorded yet.</td></tr>';
    return;
  }

  els.historyTableBody.innerHTML = state.data.history.map(row => {
    const isWeekly = row.event_type === 'weekly_win';
    const result = isWeekly ? 'Win the Week' : 'Called It!';
    const details = isWeekly
      ? `${Number(row.return_percent) > 0 ? '+' : ''}${Number(row.return_percent).toFixed(2)}%${row.week_number ? ` · Week ${row.week_number}` : ''}`
      : calledHistoryDetails(row);
    const status = isWeekly ? 'Approved' : String(row.status || 'approved').replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

    return `<tr data-history-id="${escapeHtml(row.id)}"><td>${formatDate(row.event_date)}</td><td><strong>${escapeHtml(row.participant_name)}</strong></td><td><span class="history-type">${result}</span></td><td>${details}</td><td><span class="receipt-status receipt-status-${escapeHtml(row.status || 'approved')}">${escapeHtml(status)}</span>${historyAdminActions(row)}</td><td class="history-prize">${money(row.reward_amount)}</td></tr>`;
  }).join('');

  bindHistoryActions();
}

function renderAccount() {
  const profile = state.session.profile;
  const signedIn = Boolean(state.session.user);
  const canAddOwnChallenge = Boolean(signedIn && profile?.active);
  const ownSlot = canAddOwnChallenge ? nextAvailableSlot(state.session.user.id) : null;

  els.authButton.textContent = signedIn ? 'Sign Out' : 'Sign In';
  els.accountLabel.hidden = !signedIn;
  els.accountLabel.textContent = signedIn ? `Signed in as ${profile?.display_name || 'account'}` : '';
  els.adminWeekButton.hidden = !profile?.is_admin;

  els.editMyPlaysButton.hidden = !canAddOwnChallenge;
  els.editMyPlaysButton.disabled = !canAddOwnChallenge || !ownSlot;
  els.editMyPlaysButton.textContent = ownSlot ? 'Add Challenge' : 'Challenge Slots Full';
}

function renderStatus() {
  if (!backendIsConfigured()) {
    els.dashboardStatus.textContent = 'Live editing is not enabled yet.';
    return;
  }
  if (state.session.user && !state.session.profile) {
    els.dashboardStatus.textContent = 'This login is not linked to a Goblin Investing profile.';
    return;
  }
  els.dashboardStatus.textContent = state.session.user ? '' : 'Sign in to create or check your Called It challenges.';
}

function renderAll() {
  renderTracker();
  renderWinner();
  renderParticipants();
  renderHistory();
  renderAccount();
  renderStatus();
}

function openModal(modal, focusSelector = '') {
  const active = document.activeElement;
  if (!modal.classList.contains('open') && active && typeof active.focus === 'function') modalReturnFocus = active;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    const requested = focusSelector ? modal.querySelector(focusSelector) : null;
    const fallback = modal.querySelector('[data-close-modal]');
    (requested || fallback)?.focus();
  });
}

function closeModals() {
  const returnFocus = modalReturnFocus;
  document.querySelectorAll('.modal.open').forEach(modal => {
    modal.classList.remove('open', 'single-play-mode');
    modal.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
  modalReturnFocus = null;

  if (returnFocus?.isConnected && typeof returnFocus.focus === 'function') {
    requestAnimationFrame(() => returnFocus.focus());
  }
}

function openChallengeModal(title, markup) {
  els.editTitle.textContent = title;
  els.editSlots.innerHTML = markup;
  els.editMessage.className = 'form-message';
  els.editMessage.textContent = '';
  els.editModal.classList.add('single-play-mode');
  openModal(els.editModal, '.single-called-it-form input:not([type="hidden"]):not([disabled]), .single-called-it-form select:not([disabled]), .single-called-it-form textarea:not([disabled])');
}

function showEditError(message) {
  els.editMessage.className = 'form-message error';
  els.editMessage.textContent = message || 'Could not update the challenge.';
}

function currentPreviewSettings() {
  return {
    up: Number(state.data.settings.called_it_up_percent),
    down: Number(state.data.settings.called_it_down_percent),
    flat: Number(state.data.settings.called_it_flat_percent)
  };
}

function syncAmount(form) {
  const select = form.elements.portfolio_action;
  const wrap = form.querySelector('.amount-wrap');
  if (!select || !wrap) return;
  const hidden = select.value === 'not_buying' || !select.value;
  wrap.hidden = hidden;
  if (form.elements.action_amount) form.elements.action_amount.required = !hidden;
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

function syncGoal(form) {
  const goal = form.querySelector('[data-single-goal]');
  if (!goal) return;
  const direction = form.elements.direction?.value || '';
  const raw = form.dataset.previewPrice || form.dataset.referencePrice || '';
  goal.textContent = goalPreview(Number(raw), direction, currentPreviewSettings());
}

function storedGoalPreview(play) {
  if (!play) return '—';
  const goal = goalLabel(play);
  if (!goal || goal === '—') return '—';
  return play.direction === 'flat' ? `End range ${goal}` : `Goal ${goal}`;
}

function setQuotePreview(form, quoteResponse) {
  const quote = form.querySelector('[data-single-quote]');
  if (!quote || !quoteResponse?.quote) return;
  form.dataset.previewPrice = String(quoteResponse.quote.price);
  form.dataset.previewTicker = String(form.elements.ticker?.value || '').toUpperCase();
  quote.textContent = `${money(quoteResponse.quote.price)} · ${quoteResponse.quote.market_status === 'open' ? 'market open' : 'latest price'}`;
  syncGoal(form);
}

function restoreOriginalAdminPreview(form, play) {
  if (!play) return;
  form.dataset.previewPrice = '';
  form.dataset.previewTicker = '';
  const quote = form.querySelector('[data-single-quote]');
  const goal = form.querySelector('[data-single-goal]');
  if (quote) quote.textContent = `${money(play.reference_price)} · original call price`;
  if (goal) goal.textContent = storedGoalPreview(play);
}

async function ensureAdminTermsPreview(form, play, nextDirection) {
  if (form.dataset.mode !== 'admin-edit' || !play) return;
  const ticker = String(form.elements.ticker?.value || '').toUpperCase();
  if (!ticker) {
    const goal = form.querySelector('[data-single-goal]');
    if (goal) goal.textContent = 'Choose a stock to load the current price.';
    return;
  }

  const termsChanged = ticker !== String(play.ticker || '').toUpperCase() || nextDirection !== play.direction;

  if (!termsChanged) {
    restoreOriginalAdminPreview(form, play);
    return;
  }

  if (form.dataset.previewTicker === ticker && form.dataset.previewPrice) {
    syncGoal(form);
    return;
  }

  const quote = form.querySelector('[data-single-quote]');
  if (quote) quote.textContent = 'Loading fresh price for the restarted challenge…';
  try {
    const response = await previewCalledIt(state.session.client, ticker);
    setQuotePreview(form, response);
  } catch (error) {
    if (quote) quote.textContent = error.message || 'Current price is unavailable.';
    showEditError(error.message || 'Current price is unavailable.');
  }
}

function bindTickerSearch(form) {
  const input = form.elements.ticker_search;
  const hidden = form.elements.ticker;
  const results = form.querySelector('.ticker-results');
  const quote = form.querySelector('[data-single-quote]');
  if (!input || !hidden || !results || !quote) return;

  let timer = null;
  let sequence = 0;

  input.addEventListener('input', () => {
    hidden.value = '';
    form.dataset.previewPrice = '';
    form.dataset.previewTicker = '';
    quote.textContent = 'Choose a stock to load the current price.';
    const goal = form.querySelector('[data-single-goal]');
    if (goal) goal.textContent = 'Choose a stock to load the current price.';
    clearTimeout(timer);
    const query = input.value.trim();

    if (!query) {
      results.hidden = true;
      results.innerHTML = '';
      return;
    }

    const current = ++sequence;
    timer = setTimeout(async () => {
      try {
        const rows = await searchSecurities(state.session.client, query, 10);
        if (current !== sequence) return;
        results.innerHTML = rows.length ? rows.map(tickerResultMarkup).join('') : '<div class="ticker-no-results">No matching listed stocks.</div>';
        results.hidden = false;
      } catch (error) {
        if (current !== sequence) return;
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
      const response = await previewCalledIt(state.session.client, button.dataset.ticker);
      setQuotePreview(form, response);
    } catch (error) {
      quote.textContent = error.message || 'Current price is unavailable.';
      showEditError(error.message || 'Current price is unavailable.');
    }
  });
}

function bindSingleForm(form, play = null) {
  if (!form) return;
  if (play?.reference_price) form.dataset.referencePrice = String(play.reference_price);

  bindTickerSearch(form);
  if (form.elements.direction) {
    syncActionForDirection(form);
    if (form.dataset.mode === 'admin-edit' && play) restoreOriginalAdminPreview(form, play);
    else syncGoal(form);

    form.querySelectorAll('[data-single-direction]').forEach(button => {
      button.addEventListener('click', async () => {
        const nextDirection = button.dataset.singleDirection;
        form.elements.direction.value = nextDirection;
        form.querySelectorAll('[data-single-direction]').forEach(item => {
          const selected = item === button;
          item.classList.toggle('selected', selected);
          item.setAttribute('aria-pressed', String(selected));
        });
        syncActionForDirection(form);
        if (form.dataset.mode === 'admin-edit' && play) await ensureAdminTermsPreview(form, play, nextDirection);
        else syncGoal(form);
      });
    });
  } else {
    syncAmount(form);
  }

  form.elements.portfolio_action?.addEventListener('change', () => syncAmount(form));

  form.querySelector('[data-single-cancel]')?.addEventListener('click', async () => {
    if (!play?.id || !confirm('Cancel this challenge? It will not pay and the active challenge will close.')) return;
    try {
      await cancelCalledIt(state.session.client, play.id);
      closeModals();
      await refreshData();
    } catch (error) {
      showEditError(error.message);
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');

    try {
      submit.disabled = true;
      els.editMessage.className = 'form-message';
      els.editMessage.textContent = 'Saving…';

      const mode = form.dataset.mode;
      const action = form.elements.portfolio_action.value;
      const amount = action === 'not_buying' ? null : Number(form.elements.action_amount.value);

      if (mode === 'owner-edit') {
        const { error } = await state.session.client.rpc('edit_own_called_it_metadata', {
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
          owner_id: play?.owner_id || form.dataset.ownerId || state.session.user.id,
          slot_number: Number(form.dataset.slot),
          ticker,
          direction,
          reason: form.elements.reason.value,
          portfolio_action: action,
          action_amount: amount
        };

        if (mode === 'admin-edit') await adminEditCalledIt(state.session.client, form.dataset.challengeId, payload);
        else await createCalledIt(state.session.client, payload);
      }

      closeModals();
      await refreshData();
    } catch (error) {
      showEditError(error.message);
      submit.disabled = false;
    }
  });
}

function openPlayEditor(challengeId) {
  const play = state.data.plays.find(item => item.id === challengeId);
  if (!play) {
    openChallengeModal('Called It challenge', '<div class="called-it-static"><strong>Could not open challenge</strong><span>Challenge not found.</span></div>');
    return;
  }
  if (!state.session.user || !state.session.profile) {
    openModal(els.authModal, '#authEmail');
    return;
  }
  if (play.status !== 'active') {
    openChallengeModal('Called It challenge', '<div class="called-it-static"><strong>Could not open challenge</strong><span>Only an active challenge can be edited.</span></div>');
    return;
  }
  if (!state.session.profile.is_admin && play.owner_id !== state.session.user.id) return;

  const adminMode = Boolean(state.session.profile.is_admin);
  openChallengeModal(
    `Edit ${play.ticker}`,
    adminMode
      ? singleChallengeFormMarkup({ play, slotNumber: play.slot_number, adminEdit: true })
      : ownerEditFormMarkup(play)
  );
  bindSingleForm(els.editSlots.querySelector('.single-called-it-form'), play);
}

function openAddForOwner(ownerId) {
  if (!state.session.user || !state.session.profile) {
    if (backendIsConfigured()) openModal(els.authModal, '#authEmail');
    return;
  }
  if (ownerId !== state.session.user.id && !state.session.profile.is_admin) return;

  const slot = nextAvailableSlot(ownerId);
  if (!slot) {
    openChallengeModal('Add Called It challenge', '<div class="called-it-static"><strong>Both slots are unavailable</strong><span>Both challenge slots are active, under review, or in cooldown.</span></div>');
    return;
  }

  const owner = participantById(ownerId);
  const title = ownerId === state.session.user.id
    ? `Add Challenge ${slot}`
    : `Add ${owner?.display_name || 'participant'} Challenge ${slot}`;

  openChallengeModal(title, singleChallengeFormMarkup({ slotNumber: slot }));
  const form = els.editSlots.querySelector('.single-called-it-form');
  form.dataset.ownerId = ownerId;
  bindSingleForm(form);
}

async function refreshData() {
  state.data = await loadDashboardData(state.session.client);
  renderAll();
}

async function refreshSessionAndData() {
  try {
    state.session = await getSessionState();
    state.data = await loadDashboardData(state.session.client);
  } catch (error) {
    console.error(error);
    state.session = { configured: backendIsConfigured(), client: null, user: null, profile: null };
    state.data = fallbackDashboardData();
  }

  if (!state.session.user) closeModals();
  renderAll();
}

function scheduleAuthRefresh() {
  window.clearTimeout(scheduleAuthRefresh.timer);
  scheduleAuthRefresh.timer = window.setTimeout(() => {
    refreshSessionAndData().catch(error => console.error('Auth state refresh failed', error));
  }, 0);
}
scheduleAuthRefresh.timer = 0;

els.authButton.addEventListener('click', async () => {
  if (state.session.user) {
    try {
      closeModals();
      await signOut();
      await refreshSessionAndData();
    } catch {
      els.dashboardStatus.textContent = 'Could not sign out.';
    }
    return;
  }

  if (!backendIsConfigured()) {
    els.dashboardStatus.textContent = 'Editing is not available yet.';
    return;
  }

  els.authMessage.textContent = '';
  openModal(els.authModal, '#authEmail');
});

els.authForm.addEventListener('submit', async event => {
  event.preventDefault();
  els.authMessage.className = 'form-message';
  els.authMessage.textContent = 'Signing in…';
  const result = await signIn(els.authEmail.value, els.authPassword.value);

  if (!result.ok) {
    els.authMessage.className = 'form-message error';
    els.authMessage.textContent = result.message;
    return;
  }

  els.authPassword.value = '';
  closeModals();
  await refreshSessionAndData();
});

els.editMyPlaysButton.addEventListener('click', () => {
  if (!state.session.user || !state.session.profile?.active) return;
  openAddForOwner(state.session.user.id);
});

els.adminWeekButton.addEventListener('click', () => {
  const winner = state.data.winner;
  const settings = state.data.settings;
  els.winnerNameInput.innerHTML = '<option value="">Choose winner</option>' + state.data.participants.map(participant => `<option value="${escapeHtml(participant.user_id)}">${escapeHtml(participant.display_name)}</option>`).join('');
  els.winnerNameInput.value = winner?.winner_user_id || '';
  els.winnerReturnInput.value = winner?.return_percent ?? '';
  els.currentWeekInput.value = settings.current_week || 1;
  els.weekStartInput.value = winner?.week_start || '';
  els.weekEndInput.value = winner?.week_end || '';
  els.winnerChartInput.value = '';
  els.calledUpInput.value = settings.called_it_up_percent;
  els.calledDownInput.value = settings.called_it_down_percent;
  els.calledFlatInput.value = settings.called_it_flat_percent;
  els.calledDurationInput.value = settings.called_it_duration_days;
  els.calledCooldownInput.value = settings.called_it_review_lock_days;
  els.calledClaimInput.value = settings.called_it_flat_claim_days;
  els.calledPayoutInput.value = settings.called_it_payout;
  els.weekMessage.textContent = '';
  openModal(els.weekModal, '#winnerNameInput');
});

els.weekForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.session.profile?.is_admin) return;
  const participant = participantById(els.winnerNameInput.value);

  if (!participant) {
    els.weekMessage.className = 'form-message error';
    els.weekMessage.textContent = 'Choose a winner.';
    return;
  }

  try {
    els.weekMessage.className = 'form-message';
    els.weekMessage.textContent = 'Saving…';
    await saveGameSettings(state.session.client, {
      current_week: els.currentWeekInput.value,
      weekly_stock_buy_min: state.data.settings.weekly_stock_buy_min || 5,
      called_it_up_percent: els.calledUpInput.value,
      called_it_down_percent: els.calledDownInput.value,
      called_it_flat_percent: els.calledFlatInput.value,
      called_it_duration_days: els.calledDurationInput.value,
      called_it_review_lock_days: els.calledCooldownInput.value,
      called_it_flat_claim_days: els.calledClaimInput.value,
      called_it_payout: els.calledPayoutInput.value
    });
    await saveWeeklyWinner(state.session.client, {
      winner_user_id: participant.user_id,
      winner_name: participant.display_name,
      return_percent: els.winnerReturnInput.value,
      week_start: els.weekStartInput.value,
      week_end: els.weekEndInput.value,
      chart_url: state.data.winner?.chart_url || null
    }, els.winnerChartInput.files[0] || null);
    await refreshData();
    closeModals();
  } catch (error) {
    els.weekMessage.className = 'form-message error';
    els.weekMessage.textContent = error.message || 'Could not update the week.';
  }
});

document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModals));

let pointerDownOnBackdrop = null;
document.addEventListener('pointerdown', event => {
  pointerDownOnBackdrop = event.target.classList?.contains('modal') ? event.target : null;

  document.querySelectorAll('.ticker-results:not([hidden])').forEach(results => {
    const wrap = results.closest('.ticker-search-wrap');
    if (!wrap?.contains(event.target)) results.hidden = true;
  });
}, true);

document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', event => {
  if (event.target === modal && pointerDownOnBackdrop === modal) closeModals();
  pointerDownOnBackdrop = null;
}));

document.addEventListener('pointercancel', () => { pointerDownOnBackdrop = null; }, true);

const gameHelp = document.querySelector('.game-help');
const gameHelpSummary = gameHelp?.querySelector('summary');
gameHelp?.addEventListener('toggle', () => {
  gameHelpSummary?.setAttribute('aria-label', gameHelp.open ? 'Close Called It help' : 'Called It help');
});
document.addEventListener('click', event => {
  if (!gameHelp?.open) return;
  if (event.target === gameHelp || !gameHelp.contains(event.target)) gameHelp.removeAttribute('open');
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  gameHelp?.removeAttribute('open');
  closeModals();
});

await refreshSessionAndData();

const authClient = state.session.client;
authClient?.auth.onAuthStateChange((event) => {
  if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
  scheduleAuthRefresh();
});
