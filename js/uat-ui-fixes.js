const participantsGrid = document.getElementById('participantsGrid');
const editMyPlaysButton = document.getElementById('editMyPlaysButton');
const editModal = document.getElementById('editModal');
const editSlots = document.getElementById('editSlots');
const editTitle = document.getElementById('editTitle');
const historyTableBody = document.getElementById('historyTableBody');

function slotNumber(slot) {
  const label = slot?.querySelector('.slot-label')?.textContent || '';
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function addTriggerForParticipant(card) {
  const adminTrigger = card.querySelector('.participant-head [data-add-owner]');
  if (adminTrigger && !adminTrigger.disabled) return adminTrigger;

  if (card.querySelector('.you-badge') && editMyPlaysButton && !editMyPlaysButton.disabled) {
    return editMyPlaysButton;
  }

  return null;
}

function setAddModalSlot(number) {
  if (!number || !editModal?.classList.contains('open')) return;
  const form = editSlots?.querySelector('.single-called-it-form[data-mode="add"]');
  if (!form) return;

  form.dataset.slot = String(number);
  const register = form.querySelector('.call-form-register');
  if (register) register.textContent = `CALLED IT! SLOT ${number}`;
  if (editTitle) editTitle.textContent = `Add Called It! · Slot ${number}`;
}

function patchSlotControls() {
  if (!participantsGrid) return;

  participantsGrid.querySelectorAll('.participant-card').forEach(card => {
    const trigger = addTriggerForParticipant(card);

    card.querySelectorAll('.play-slot').forEach(slot => {
      const number = slotNumber(slot);
      if (!number) return;

      const label = slot.querySelector('.slot-label');
      const desiredLabel = `CALLED IT! SLOT ${number}`;
      if (label && label.textContent !== desiredLabel) label.textContent = desiredLabel;

      const pencil = slot.querySelector('[data-play-edit-id]');
      if (pencil) {
        pencil.setAttribute('aria-label', `Edit Called It slot ${number}`);
        pencil.title = `Edit slot ${number}`;
      }

      if (!slot.classList.contains('empty-slot')) return;

      const existing = slot.querySelector('.empty-slot-add');
      if (!trigger) {
        slot.classList.remove('can-add-slot');
        existing?.remove();
        return;
      }

      slot.classList.add('can-add-slot');
      if (existing) return;

      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'empty-slot-add';
      add.textContent = '+ Add';
      add.setAttribute('aria-label', `Add Called It challenge in slot ${number}`);
      add.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        trigger.click();
        queueMicrotask(() => setAddModalSlot(number));
      });
      slot.append(add);
    });
  });
}

function patchHistoryPresentation() {
  historyTableBody?.querySelectorAll('.history-prize').forEach(cell => {
    const text = cell.textContent.trim();
    if (/^\$\d/.test(text) && !/^\$0(?:\.00)?$/.test(text)) cell.textContent = `+${text}`;
  });
}

participantsGrid?.addEventListener('click', event => {
  const pencil = event.target.closest('[data-play-edit-id]');
  if (!pencil) return;
  const number = slotNumber(pencil.closest('.play-slot'));
  if (!number) return;
  queueMicrotask(() => {
    if (editModal?.classList.contains('open') && editTitle) {
      editTitle.textContent = `Edit Called It! · Slot ${number}`;
      const register = editSlots?.querySelector('.call-form-register');
      if (register) register.textContent = `CALLED IT! SLOT ${number}`;
    }
  });
});

if (participantsGrid) {
  const observer = new MutationObserver(() => patchSlotControls());
  observer.observe(participantsGrid, { childList: true, subtree: true });
  patchSlotControls();
}

if (historyTableBody) {
  const historyObserver = new MutationObserver(() => patchHistoryPresentation());
  historyObserver.observe(historyTableBody, { childList: true, subtree: true });
  patchHistoryPresentation();
}
