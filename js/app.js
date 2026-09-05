import { backendIsConfigured, getSessionState, signIn, signOut } from './auth.js';
import { buildPlayPayload, cancelPlay, fallbackDashboardData, getOwnerSlots, loadDashboardData, replacePlay, savePlay, saveWeeklyWinner } from './plays.js';

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
  return number.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: number < 100 ? 2 : 0, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

function playMarkup(play, slotNumber) {
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
  </div>`;
}

function renderParticipants() {
  const userId = state.session.user?.id || null;
  els.participantsGrid.innerHTML = state.data.participants.map(participant => {
    const slots = getOwnerSlots(state.data.plays, participant.user_id);
    const isYou = Boolean(userId && participant.user_id === userId);
    return `<article class="participant-card">
      <div class="participant-head">
        <div class="participant-name">${escapeHtml(participant.display_name)}</div>
        ${isYou ? '<span class="you-badge">YOU</span>' : ''}
      </div>
      <div class="slot-list">${playMarkup(slots[0], 1)}${playMarkup(slots[1], 2)}</div>
    </article>`;
  }).join('');
}

function renderAccount() {
  const profile = state.session.profile;
  const signedIn = Boolean(state.session.user);
  els.authButton.textContent = signedIn ? 'Sign Out' : 'Sign In';
  els.accountLabel.hidden = !signedIn;
  els.accountLabel.textContent = signedIn ? `Signed in as ${profile?.display_name || 'account'}` : '';
  els.adminWeekButton.hidden = !profile?.is_admin;
}

function renderStatus() {
  if (!backendIsConfigured()) {
    els.dashboardStatus.textContent = 'Live editing is not enabled yet. The dashboard is ready for the backend connection.';
    return;
  }
  els.dashboardStatus.textContent = state.session.user ? '' : 'Sign in to edit your own two plays.';
}

function renderAll() {
  renderWinner();
  renderParticipants();
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
    <div class="calc-note">Target price is calculated at +10%. Expiration is calculated four weeks from the call date.</div>
    <div class="slot-form-actions">
      <button class="button button-primary" type="submit">Save</button>
      ${play ? '<button class="button button-secondary" type="button" data-replace>Replace Play</button><button class="button button-danger" type="button" data-cancel>Cancel Play</button>' : ''}
    </div>
  </form>`;
}

function openEditModal() {
  if (!state.session.user || !state.session.profile) {
    if (backendIsConfigured()) openModal(els.authModal);
    else {
      els.dashboardStatus.textContent = 'Editing is not available yet.';
    }
    return;
  }
  if (state.session.profile.is_admin && !state.session.profile.active) {
    els.dashboardStatus.textContent = 'This admin account is not linked to participant play slots.';
    return;
  }
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
    els.dashboardStatus.textContent = 'The dashboard could not load live data.';
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
  els.winnerNameInput.value = winner?.winner_name || '';
  els.winnerReturnInput.value = winner?.return_percent ?? '';
  els.weekStartInput.value = winner?.week_start || '';
  els.weekEndInput.value = winner?.week_end || '';
  els.winnerChartInput.value = '';
  els.weekMessage.textContent = '';
  openModal(els.weekModal);
});

els.weekForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.session.profile?.is_admin) return;
  try {
    els.weekMessage.className = 'form-message';
    els.weekMessage.textContent = 'Saving…';
    await saveWeeklyWinner(state.session.client, {
      winner_name: els.winnerNameInput.value,
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
