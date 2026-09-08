/* R3 presentation-only state copy. Keeps public read failures distinct from signed-out editing state. */

const authButton = document.getElementById('authButton');
const dashboardStatus = document.getElementById('dashboardStatus');
const winnerContent = document.getElementById('winnerContent');
const participantsGrid = document.getElementById('participantsGrid');
const weeklyLeaderName = document.getElementById('weeklyLeaderName');
const weeklyLeaderCount = document.getElementById('weeklyLeaderCount');
const calledLeaderName = document.getElementById('calledLeaderName');
const calledLeaderCount = document.getElementById('calledLeaderCount');
const historyTableBody = document.getElementById('historyTableBody');
const purchaseMinimumNote = document.getElementById('purchaseMinimumNote');

function normalizePublicFailureCopy() {
  if (purchaseMinimumNote?.textContent.trim() === 'Current weekly buy-in requirement is unavailable.') {
    purchaseMinimumNote.textContent = "Current weekly buy-in couldn't load.";
  }

  const winnerEmpty = winnerContent?.querySelector('.winner-name.winner-empty');
  if (winnerEmpty?.textContent.trim() === 'Weekly result unavailable.') {
    winnerEmpty.textContent = "Weekly result couldn't load.";
  }
  const winnerMuted = winnerContent?.querySelector('.muted');
  if (winnerMuted?.textContent.trim() === 'Current winner data could not be loaded.') {
    winnerMuted.textContent = 'Try again in a moment.';
  }

  const participantError = participantsGrid?.querySelector('.data-unavailable');
  if (participantError?.textContent.trim() === 'Current Called It records are unavailable.') {
    participantError.textContent = "Current Called It records couldn't load.";
  }

  if (weeklyLeaderName?.textContent.trim() === 'Unavailable') {
    weeklyLeaderName.textContent = '—';
    weeklyLeaderCount.textContent = '';
  }
  if (calledLeaderName?.textContent.trim() === 'Unavailable') {
    calledLeaderName.textContent = '—';
    calledLeaderCount.textContent = '';
  }

  const historyError = historyTableBody?.querySelector('.history-empty');
  if (historyError?.textContent.trim() === 'Results history is unavailable.') {
    historyError.textContent = "Results couldn't load. Refresh to try again.";
  }

  if (dashboardStatus?.textContent.trim() === 'Live Goblin Investing data could not be loaded. Current records and settings are unavailable.') {
    dashboardStatus.textContent = "Live data couldn't load. Refresh to try again.";
  }
}

function makeSignedOutActionClickable() {
  if (!dashboardStatus || !authButton) return;
  if (dashboardStatus.querySelector('.inline-auth-link')) return;
  if (dashboardStatus.textContent.trim() !== 'Sign in to create or check your Called It challenges.') return;

  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'inline-auth-link';
  link.textContent = 'Sign in';
  link.addEventListener('click', () => authButton.click());

  dashboardStatus.replaceChildren(link, document.createTextNode(' to create or check your Called It challenges.'));
}

function polishStateCopy() {
  normalizePublicFailureCopy();
  makeSignedOutActionClickable();
}

const observer = new MutationObserver(polishStateCopy);
observer.observe(document.body, { subtree: true, childList: true, characterData: true });
polishStateCopy();
