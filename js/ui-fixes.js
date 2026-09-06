const status = document.getElementById('dashboardStatus');
const adminMetaText = 'Admin: edit any participant with the Edit button on their card.';

function clearAdminMetaStatus() {
  if (status?.textContent.trim() === adminMetaText) status.textContent = '';
}

if (status) {
  clearAdminMetaStatus();
  new MutationObserver(clearAdminMetaStatus).observe(status, { childList: true, characterData: true, subtree: true });
}

let pointerStartModal = null;
let pointerStartedInsideCard = false;

function resetPointerState() {
  pointerStartModal = null;
  pointerStartedInsideCard = false;
}

document.addEventListener('pointerdown', event => {
  const modal = event.target.closest?.('.modal');
  pointerStartModal = modal || null;
  pointerStartedInsideCard = Boolean(modal && event.target.closest?.('.modal-card'));
}, true);

document.addEventListener('click', event => {
  const targetIsBackdrop = event.target.classList?.contains('modal');
  if (targetIsBackdrop && pointerStartedInsideCard && pointerStartModal === event.target) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  resetPointerState();
}, true);

document.addEventListener('pointercancel', resetPointerState, true);