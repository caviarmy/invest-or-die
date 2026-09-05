import { backendIsConfigured, getSessionState, signIn, signOut } from './auth.js';
import { buildPlayPayload, cancelPlay, cashOutCalledIt, fallbackDashboardData, getOwnerSlots, loadDashboardData, replacePlay, savePlay, saveWeeklyWinner, saveGameSettings } from './plays.js';

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
  winnerChartInput: document.getElementById('winnerChartInput')
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(number) ? 0 : 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderTracker() {
  const week = Number(state.data.settings?.current_week) || 1;
  const weeklyMin = Number(state.data.settings?.weekly_stock_buy_min) || 5;
  const total = week * weeklyMin;
  els.currentWeekValue.textContent = `Week ${week}`;
  els.purchaseMinimumValue.textContent = money(total);
  els.purchaseMinimumNote.textContent = `At least ${money(total)} of stock bought total (${money(weeklyMin)} × ${week} weeks). Current value does not matter.`;
}

function renderWinner() {
  const winner = state.data.winner;
  if (!winner) {
    els.winnerContent.innerHTML = '<h1>Winner not posted yet.</h1><p class="muted">This week\'s result will show here after it is entered.</p>';
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

function playMarkup(play, slotNumber, canCashOut) {
  if (!play) {
    return `<div class="play-slot empty-slot"><div class="slot-label">PLAY ${slotNumber}</div><b>Open slot</b><span>No active call.</span></div>`;
  }
  return `<div class="play-slot">
    <div class="slot-label">PLAY ${slotNumber}</div>
    <div class="play-ticker">${escapeHtml(play.ticker)}</div>
    <div class="play-meta">
      <div><span>COMMITTED</span><b>${money(play.amount_committed)}</b></div>
      <div><span>CALLED AT</span><b>${money(play.call_price)}</b></div>
      <div><span>TARGET</span><b>${money(play.target_price)}</b></div>
      <div><span>EXPIRES</span><b>${formatDate(play.expires_at)}</b></div>
    </div>
    ${play.research_note ? `<div class="play-copy"><strong>What I found:</strong> ${escapeHtml(play.research_note)}</div>` : ''}
    ${play.thesis ? `<div class="play-copy"><strong>My call:</strong> ${escapeHtml(play.thesis)}</div>` : ''}
    ${canCashOut ? `<button class="cashout-button" type="button" data-cashout-id="${escapeHtml(play.id)}">Cash Out Called It! +$5</button>` : ''}
  </div>`;
}

function renderParticipants() {
  const userId = state.session.user?.id || null;
  const isAdmin = Boolean(state.session.profile?.is_admin);
  els.participantsGrid.innerHTML = state.data.participants.map(participant => {
    const slots = getOwnerSlots(state.data.plays, participant.user_id);
    const isYou = Boolean(userId && participant.user_id === userId);
    return `<article class="participant-card">
      <div class="participant-head">
        <div class="participant-name">${escapeHtml(participant.display_name)}</div>
        ${isYou ? '<span class="you-badge">YOU</span>' : ''}
      </div>
      <div class="slot-list">${playMarkup(slots[0], 1, isAdmin)}${playMarkup(slots[1], 2, isAdmin)}</div>
    </article>`;
  }).join('');

  els.participantsGrid.querySelectorAll('[data-cashout-id]').forEach(button => {
    button.addEventListener('click', async () => {
      const play = state.data.plays.find(item => item.id === button.dataset.cashoutId);
      if (!play || !state.session.profile?.is_admin) return;
      const participant = state.data.participants.find(item => item.user_id === play.owner_id);
      if (!confirm(`Cash out ${participant?.display_name || 'this player'}'s ${play.ticker} Called It! for $5? This closes the play and adds it to History.`)) return;
      try {
        button.disabled = true;
        button.textContent = 'Cashing out…';
        await cashOutCalledIt(state.session.client, play);
        await refreshData();
      } catch (error) {
        els.dashboardStatus.textContent = error.message || 'Could not cash out the Called It!';
      }
    });
  });
}

function leaderFor(type) {
  const counts = new Map();
  state.data.history.filter(row => row.event_type === type).forEach(row => {
    const key = row.participant_name || 'Unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  if (!counts.size) return { name: 'No wins yet', count: 0 };
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const max = sorted[0][1];
  const leaders = sorted.filter(([, count]) => count === max).map(([name]) => name);
  return { name: leaders.join(' + '), count: max };
}

function renderHistory() {
  const weekly = leaderFor('weekly_win');
  const called = leaderFor('called_it');
  els.weeklyLeaderName.textContent = weekly.name;
  els.weeklyLeaderCount.textContent = `${weekly.count} ${weekly.count === 1 ? 'win' : 'wins'}`;
  els.calledLeaderName.textContent = called.name;
  els.calledLeaderCount.textContent = `${called.count} ${called.count === 1 ? 'win' : 'wins'}`;

  if (!state.data.history.length) {
    els.historyTableBody.innerHTML = '<tr><td colspan="5" class="history-empty">No results recorded yet.</td></tr>';
    return;
  }

  els.historyTableBody.innerHTML = state.data.history.map(row => {
    const isWeekly = row.event_type === 'weekly_win';
    const result = isWeekly ? 'Win the Week' : 'Called It!';
    const details = isWeekly
      ? `${Number(row.return_percent) > 0 ? '+' : ''}${Number(row.return_percent).toFixed(2)}%${row.week_number ? ` · Week ${row.week_number}` : ''}`
      : `${escapeHtml(row.ticker || '')}${row.target_price ? ` · target ${money(row.target_price)}` : ''}`;
    return `<tr>
      <td>${formatDate(row.event_date)}</td>
      <td><strong>${escapeHtml(row.participant_name)}</strong></td>
      <td><span class="history-type ${isWeekly ? 'history-type-week' : 'history-type-call'}">${result}</span></td>
      <td>${details}</td>
      <td class="history-prize">${money(row.reward_amount)}</td>
    </tr>`;
  }).join('');
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
  els.dashboardStatus.textContent = state.session.user ? '' : 'Sign in to edit your own two plays.';
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

function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function slotFormMarkup(play, slotNumber) {
  return `<form class="slot-form" data-slot="${slotNumber}">
    <div class="slot-form-head"><div class="slot-form-title">Play ${slotNumber}</div><span class="muted">${play ? 'Active' : 'Open'}</span></div>
    <label>Ticker<input name="ticker" maxlength="12" value="${escapeHtml(play?.ticker || '')}" required></label>
    <label>Amount committed<input name="amount_committed" type="number" min="5" step="0.01" value="${escapeHtml(play?.amount_committed ?? 5)}" required></label>
    <label>Call price<input name="call_price" type="number" min="0.0001" step="0.0001" value="${escapeHtml(play?.call_price || '')}" required></label>
    <label>Call date<input name="call_date" type="date" value="${escapeHtml(play?.call_date || todayIso())}" required></label>
    <label>What I found<textarea name="research_note" maxlength="800">${escapeHtml(play?.research_note || '')}</textarea></label>
    <label>My call<textarea name="thesis" maxlength="800">${escapeHtml(play?.thesis || '')}</textarea></label>
    <div class="calc-note">Target price is calculated at +10%. Expiration is four weeks from the call date.</div>
    <div class="slot-form-actions">
      <button class="button button-primary" type="submit">Save</button>
      ${play ? '<button class="button button-secondary" type="button" data-replace>Replace Play</button><button class="button button-danger" type="button" data-cancel>Cancel Play</button>' : ''}
    </div>
  </form>`;
}

function openEditModal() {
  if (!state.session.user || !state.session.profile) {
    if (backendIsConfigured()) openModal(els.authModal);
    else els.dashboardStatus.textContent = 'Editing is not available yet.';
    return;
  }
  if (state.session.profile.is_admin && !state.session.profile.active) return;
  const slots = getOwnerSlots(state.data.plays, state.session.user.id);
  els.editSlots.innerHTML = slotFormMarkup(slots[0], 1) + slotFormMarkup(slots[1], 2);
  els.editMessage.textContent = '';
  bindEditForms(slots);
  openModal(els.editModal);
}

function bindEditForms(slots) {
  els.editSlots.querySelectorAll('.slot-form').forEach(form => {
    const slotNumber = Number(form.dataset.slot);
    const currentPlay = slots[slotNumber - 1];

    form.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        els.editMessage.className = 'form-message';
        els.editMessage.textContent = 'Saving…';
        const payload = buildPlayPayload(new FormData(form), state.session.user.id, slotNumber);
        await savePlay(state.session.client, currentPlay, payload);
        await refreshData();
        els.editMessage.textContent = 'Saved.';
        openEditModal();
      } catch (error) {
        els.editMessage.className = 'form-message error';
        els.editMessage.textContent = error.message || 'Could not save the play.';
      }
    });

    form.querySelector('[data-cancel]')?.addEventListener('click', async () => {
      if (!confirm(`Cancel Play ${slotNumber}? It will no longer be active.`)) return;
      try {
        await cancelPlay(state.session.client, currentPlay);
        await refreshData();
        openEditModal();
      } catch (error) {
        els.editMessage.className = 'form-message error';
        els.editMessage.textContent = error.message || 'Could not cancel the play.';
      }
    });

    form.querySelector('[data-replace]')?.addEventListener('click', async () => {
      if (!confirm(`Replace Play ${slotNumber}? The current play will be cancelled and the form values will become the new call.`)) return;
      try {
        const payload = buildPlayPayload(new FormData(form), state.session.user.id, slotNumber);
        await replacePlay(state.session.client, currentPlay, payload);
        await refreshData();
        openEditModal();
      } catch (error) {
        els.editMessage.className = 'form-message error';
        els.editMessage.textContent = error.message || 'Could not replace the play.';
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
    } catch (error) {
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

els.editMyPlaysButton.addEventListener('click', openEditModal);
els.adminWeekButton.addEventListener('click', () => {
  const winner = state.data.winner;
  els.winnerNameInput.innerHTML = '<option value="">Choose winner</option>' + state.data.participants.map(participant =>
    `<option value="${escapeHtml(participant.user_id)}">${escapeHtml(participant.display_name)}</option>`
  ).join('');
  els.winnerNameInput.value = winner?.winner_user_id || '';
  els.winnerReturnInput.value = winner?.return_percent ?? '';
  els.currentWeekInput.value = state.data.settings?.current_week || 6;
  els.weekStartInput.value = winner?.week_start || '';
  els.weekEndInput.value = winner?.week_end || '';
  els.winnerChartInput.value = '';
  els.weekMessage.textContent = '';
  openModal(els.weekModal);
});

els.weekForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.session.profile?.is_admin) return;
  const participant = state.data.participants.find(item => item.user_id === els.winnerNameInput.value);
  if (!participant) {
    els.weekMessage.className = 'form-message error';
    els.weekMessage.textContent = 'Choose a winner.';
    return;
  }
  try {
    els.weekMessage.className = 'form-message';
    els.weekMessage.textContent = 'Saving…';
    await saveGameSettings(state.session.client, els.currentWeekInput.value, state.data.settings?.weekly_stock_buy_min || 5);
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
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModals(); }));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModals(); });

await refreshSessionAndData();
