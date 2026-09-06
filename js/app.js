import { backendIsConfigured, getSessionState, signIn, signOut } from './auth.js';
import { fallbackDashboardData, getOwnerSlots, loadDashboardData, saveWeeklyWinner, saveGameSettings } from './plays.js';
import { adminEditCalledIt, cancelCalledIt, checkCalledIt, createCalledIt, previewCalledIt, resetCalledItCooldown, reviewCalledIt, searchSecurities, submitCalledIt } from './market.js';
import { actionLabel, challengeCardMarkup, challengeFormMarkup, cooldownRemaining, directionLabel, escapeHtml, formatDate, formatDateTime, goalLabel, goalPreview, money, tickerResultMarkup } from './called-it-ui.js';

const state = {
  session: { configured: false, client: null, user: null, profile: null },
  data: fallbackDashboardData(),
  editContext: null
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
  els.participantsGrid.querySelectorAll('[data-admin-edit-id]').forEach(button => {
    button.addEventListener('click', () => {
      const play = state.data.plays.find(item => item.id === button.dataset.adminEditId);
      const participant = play ? participantById(play.owner_id) : null;
      if (participant) openEditModal(participant, play.id);
    });
  });
}

function renderParticipants() {
  const userId = state.session.user?.id || null;
  const isAdmin = Boolean(state.session.profile?.is_admin);
  els.participantsGrid.innerHTML = state.data.participants.map(participant => {
    const slots = getOwnerSlots(state.data.plays, participant.user_id);
    const isYou = Boolean(userId && participant.user_id === userId);
    const canManage = Boolean(state.session.user && (isYou || isAdmin));
    return `<article class="participant-card">
      <div class="participant-head">
        <div class="participant-name">${escapeHtml(participant.display_name)}</div>
        <div class="participant-actions">
          ${isYou ? '<span class="you-badge">YOU</span>' : ''}
          ${isAdmin ? `<button class="admin-edit-button" type="button" data-edit-owner="${escapeHtml(participant.user_id)}">Edit</button>` : ''}
        </div>
      </div>
      <div class="slot-list">${challengeCardMarkup(slots[0], 1, { canManage, isAdmin })}${challengeCardMarkup(slots[1], 2, { canManage, isAdmin })}</div>
    </article>`;
  }).join('');

  els.participantsGrid.querySelectorAll('[data-edit-owner]').forEach(button => {
    button.addEventListener('click', () => {
      const participant = participantById(button.dataset.editOwner);
      if (participant) openEditModal(participant);
    });
  });
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
  if (!state.session.profile?.is_admin || row.event_type !== 'called_it') return '';
  if (row.status === 'under_review') {
    return `<div class="history-actions"><button type="button" data-review-id="${escapeHtml(row.source_id)}" data-decision="approved">Approve +${money(state.data.settings.called_it_payout)}</button><button type="button" data-review-id="${escapeHtml(row.source_id)}" data-decision="rejected">Reject</button></div>`;
  }
  const play = state.data.plays.find(item => item.id === row.source_id);
  if (play && ['approved', 'rejected'].includes(row.status) && cooldownRemaining(play.lock_until)) {
    return `<div class="history-actions"><button type="button" data-reset-id="${escapeHtml(row.source_id)}">Reset Cooldown</button></div>`;
  }
  return '';
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
    return `<tr><td>${formatDate(row.event_date)}</td><td><strong>${escapeHtml(row.participant_name)}</strong></td><td><span class="history-type">${result}</span></td><td>${details}</td><td><span class="receipt-status receipt-status-${escapeHtml(row.status || 'approved')}">${escapeHtml(status)}</span>${historyAdminActions(row)}</td><td class="history-prize">${money(row.reward_amount)}</td></tr>`;
  }).join('');
  bindHistoryActions();
}

function renderAccount() {
  const profile = state.session.profile;
  const signedIn = Boolean(state.session.user);
  els.authButton.textContent = signedIn ? 'Sign Out' : 'Sign In';
  els.accountLabel.hidden = !signedIn;
  els.accountLabel.textContent = signedIn ? `Signed in as ${profile?.display_name || 'account'}` : '';
  els.adminWeekButton.hidden = !profile?.is_admin;
  els.editMyPlaysButton.hidden = Boolean(profile?.is_admin && !profile?.active);
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

function openModal(modal) {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModals() {
  document.querySelectorAll('.modal.open').forEach(modal => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
}

function activePlaySummary(play, slotNumber) {
  return `<div class="manage-slot"><div class="manage-slot-card">${challengeCardMarkup(play, slotNumber, { canManage: false, isAdmin: false })}</div>${play.status === 'active' ? `<button class="button button-danger" type="button" data-cancel-id="${escapeHtml(play.id)}">Cancel Challenge</button>` : ''}</div>`;
}

function openEditModal(participant = null, focusChallengeId = null) {
  if (!state.session.user || !state.session.profile) {
    if (backendIsConfigured()) openModal(els.authModal);
    else els.dashboardStatus.textContent = 'Editing is not available yet.';
    return;
  }

  const isAdmin = Boolean(state.session.profile.is_admin);
  const target = participant || participantById(state.session.user.id);
  if (!target?.user_id) {
    els.dashboardStatus.textContent = 'No participant profile was found for this account.';
    return;
  }
  if (!isAdmin && target.user_id !== state.session.user.id) return;

  const slots = getOwnerSlots(state.data.plays, target.user_id);
  state.editContext = { ownerId: target.user_id, displayName: target.display_name };
  els.editTitle.textContent = target.user_id === state.session.user.id ? 'My Called It challenges' : `Manage ${target.display_name}'s challenges`;
  els.editSlots.innerHTML = slots.map((play, index) => {
    const slotNumber = index + 1;
    if (!play) return challengeFormMarkup(slotNumber);
    if (isAdmin && play.status === 'active') return challengeFormMarkup(slotNumber, play, true);
    return activePlaySummary(play, slotNumber);
  }).join('');
  els.editMessage.className = 'form-message';
  els.editMessage.textContent = '';
  bindCalledItForms(target.user_id);
  bindModalCancelButtons(target);
  openModal(els.editModal);
  if (focusChallengeId) setTimeout(() => els.editSlots.querySelector(`[data-challenge-id="${CSS.escape(focusChallengeId)}"]`)?.scrollIntoView({ block: 'center' }), 0);
}

function currentPreviewSettings() {
  return {
    up: Number(state.data.settings.called_it_up_percent),
    down: Number(state.data.settings.called_it_down_percent),
    flat: Number(state.data.settings.called_it_flat_percent)
  };
}

function updateFormGoal(form) {
  const direction = form.elements.direction.value;
  const preview = form.querySelector('[data-goal-preview]');
  const referencePrice = Number(form.dataset.previewPrice || form.dataset.referencePrice);
  preview.textContent = goalPreview(referencePrice, direction, currentPreviewSettings());
}

function selectDirection(form, direction) {
  form.elements.direction.value = direction;
  form.querySelectorAll('[data-direction]').forEach(button => button.classList.toggle('selected', button.dataset.direction === direction));
  updateFormGoal(form);
}

function bindTickerSearch(form) {
  const input = form.elements.ticker_search;
  const hidden = form.elements.ticker;
  const results = form.querySelector('.ticker-results');
  const quotePreview = form.querySelector('[data-quote-preview]');
  let timer = null;
  let requestSequence = 0;

  input.addEventListener('input', () => {
    hidden.value = '';
    form.dataset.previewPrice = '';
    quotePreview.textContent = 'Choose a stock to load the current price.';
    updateFormGoal(form);
    clearTimeout(timer);
    const query = input.value.trim();
    if (!query) {
      results.hidden = true;
      results.innerHTML = '';
      return;
    }
    const sequence = ++requestSequence;
    timer = setTimeout(async () => {
      try {
        const rows = await searchSecurities(state.session.client, query, 10);
        if (sequence !== requestSequence) return;
        results.innerHTML = rows.length ? rows.map(tickerResultMarkup).join('') : '<div class="ticker-no-results">No matching listed stocks.</div>';
        results.hidden = false;
      } catch (error) {
        if (sequence !== requestSequence) return;
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
    quotePreview.textContent = 'Loading current price…';
    try {
      const response = await previewCalledIt(state.session.client, button.dataset.ticker);
      form.dataset.previewPrice = String(response.quote.price);
      quotePreview.textContent = `${money(response.quote.price)} · ${response.quote.market_status === 'open' ? 'market open' : 'latest price'}`;
      updateFormGoal(form);
    } catch (error) {
      quotePreview.textContent = error.message || 'Current price is unavailable.';
      els.editMessage.className = 'form-message error';
      els.editMessage.textContent = error.message || 'Current price is unavailable.';
    }
  });

  document.addEventListener('click', event => {
    if (!form.contains(event.target)) results.hidden = true;
  }, { once: false });
}

function bindCalledItForms(ownerId) {
  els.editSlots.querySelectorAll('.called-it-form').forEach(form => {
    const existing = form.dataset.challengeId ? state.data.plays.find(play => play.id === form.dataset.challengeId) : null;
    if (existing?.reference_price) form.dataset.referencePrice = String(existing.reference_price);
    bindTickerSearch(form);
    form.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => selectDirection(form, button.dataset.direction)));
    const actionSelect = form.elements.portfolio_action;
    const amountWrap = form.querySelector('.amount-wrap');
    const syncAmount = () => {
      const notBuying = actionSelect.value === 'not_buying';
      amountWrap.hidden = notBuying;
      form.elements.action_amount.required = !notBuying;
    };
    actionSelect.addEventListener('change', syncAmount);
    syncAmount();
    updateFormGoal(form);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const ticker = form.elements.ticker.value;
      const direction = form.elements.direction.value;
      if (!ticker) {
        els.editMessage.className = 'form-message error';
        els.editMessage.textContent = 'Choose a stock from the search results.';
        return;
      }
      if (!direction) {
        els.editMessage.className = 'form-message error';
        els.editMessage.textContent = 'Choose Go Up, Go Down, or Finish About the Same.';
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      try {
        submitButton.disabled = true;
        els.editMessage.className = 'form-message';
        els.editMessage.textContent = existing ? 'Saving changes…' : 'Saving challenge…';
        const payload = {
          owner_id: ownerId,
          slot_number: Number(form.dataset.slot),
          ticker,
          direction,
          reason: form.elements.reason.value,
          portfolio_action: form.elements.portfolio_action.value,
          action_amount: form.elements.portfolio_action.value === 'not_buying' ? null : Number(form.elements.action_amount.value)
        };
        if (existing && state.session.profile?.is_admin) await adminEditCalledIt(state.session.client, existing.id, payload);
        else await createCalledIt(state.session.client, payload);
        await refreshData();
        const target = participantById(ownerId);
        if (target) openEditModal(target);
      } catch (error) {
        els.editMessage.className = 'form-message error';
        els.editMessage.textContent = error.message || 'Could not save the challenge.';
      } finally {
        submitButton.disabled = false;
      }
    });
  });
}

function bindModalCancelButtons(target) {
  els.editSlots.querySelectorAll('[data-cancel-id]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Cancel this challenge? It will not pay and the active challenge will close.')) return;
      try {
        button.disabled = true;
        await cancelCalledIt(state.session.client, button.dataset.cancelId);
        await refreshData();
        openEditModal(target);
      } catch (error) {
        els.editMessage.className = 'form-message error';
        els.editMessage.textContent = error.message || 'Could not cancel the challenge.';
      } finally {
        button.disabled = false;
      }
    });
  });
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
  renderAll();
}

els.authButton.addEventListener('click', async () => {
  if (state.session.user) {
    try {
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
  openModal(els.authModal);
  setTimeout(() => els.authEmail.focus(), 0);
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

els.editMyPlaysButton.addEventListener('click', () => openEditModal());

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
  openModal(els.weekModal);
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
}, true);
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', event => {
  if (event.target === modal && pointerDownOnBackdrop === modal) closeModals();
  pointerDownOnBackdrop = null;
}));
document.addEventListener('pointercancel', () => { pointerDownOnBackdrop = null; }, true);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModals(); });

await refreshSessionAndData();
