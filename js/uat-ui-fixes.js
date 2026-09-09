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

function scrubDotSeparators(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue?.includes('·')) nodes.push(walker.currentNode);
  }
  nodes.forEach(node => {
    node.nodeValue = node.nodeValue.replace(/\s*·\s*/g, ' / ');
  });
}

function formatQuoteReadout(quote) {
  if (!quote) return;
  const text = quote.textContent.trim();
  const match = text.match(/^(\$[\d,.]+)\s*[·/]\s*(original call price|market open|latest price)$/i);
  if (!match) return;
  const label = /original/i.test(match[2]) ? 'Original market price' : 'Market price';
  quote.textContent = `${label}  ${match[1]}`;
}

function simplifyActionOptions(select) {
  if (!select) return;
  const labels = {
    buy: 'Buying',
    hold: 'Holding',
    sell: 'Selling',
    not_buying: 'Not Buying'
  };
  [...select.options].forEach(option => {
    const desired = labels[option.value];
    if (desired && option.textContent !== desired) option.textContent = desired;
  });
}

function enhanceSelect(select) {
  if (!select || select.closest('.uat-select-shell')) return;
  const shell = document.createElement('div');
  shell.className = 'uat-select-shell';
  select.before(shell);
  shell.append(select);
  const chevron = document.createElement('span');
  chevron.className = 'uat-select-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▼';
  shell.append(chevron);
}

function enhanceAmountStepper(form) {
  const amountInput = form?.elements?.action_amount;
  const amountWrap = form?.querySelector('.amount-wrap');
  if (!amountInput || !amountWrap || amountWrap.closest('.uat-amount-stepper')) return;

  amountInput.min = '5';
  amountInput.step = '1';
  amountInput.inputMode = 'decimal';
  amountInput.setAttribute('aria-label', 'Dollar amount');

  const normalize = () => {
    const numeric = Number(amountInput.value);
    amountInput.value = (Number.isFinite(numeric) ? Math.max(5, numeric) : 5).toFixed(2);
  };
  normalize();
  amountInput.addEventListener('blur', normalize);

  const stepper = document.createElement('div');
  stepper.className = 'uat-amount-stepper';
  amountWrap.before(stepper);
  stepper.append(amountWrap);

  const makeStepButton = (delta, label, text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'uat-amount-step';
    button.setAttribute('aria-label', label);
    button.textContent = text;
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const current = Number(amountInput.value);
      const next = Math.max(5, (Number.isFinite(current) ? current : 5) + delta);
      amountInput.value = next.toFixed(2);
      amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      amountInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return button;
  };

  stepper.prepend(makeStepButton(-1, 'Decrease amount by one dollar', '−'));
  stepper.append(makeStepButton(1, 'Increase amount by one dollar', '+'));
  stepper.hidden = amountWrap.hidden;

  const visibilityObserver = new MutationObserver(() => {
    stepper.hidden = amountWrap.hidden;
  });
  visibilityObserver.observe(amountWrap, { attributes: true, attributeFilter: ['hidden'] });
}

function patchEditFormPresentation() {
  if (!editSlots) return;
  const form = editSlots.querySelector('.single-called-it-form');
  if (!form) return;

  const tickerSearch = form.elements?.ticker_search;
  if (tickerSearch && tickerSearch.value.includes('·')) {
    tickerSearch.value = tickerSearch.value.replace(/\s*·\s*/g, ' / ');
  }

  const quote = form.querySelector('[data-single-quote]');
  formatQuoteReadout(quote);

  const actionSelect = form.elements?.portfolio_action;
  simplifyActionOptions(actionSelect);
  enhanceSelect(actionSelect);
  enhanceAmountStepper(form);
  scrubDotSeparators(form);
}

function setAddModalSlot(number) {
  if (!number || !editModal?.classList.contains('open')) return;
  const form = editSlots?.querySelector('.single-called-it-form[data-mode="add"]');
  if (!form) return;

  form.dataset.slot = String(number);
  const register = form.querySelector('.call-form-register');
  if (register) register.textContent = `CALLED IT! SLOT ${number}`;
  if (editTitle) editTitle.textContent = `Add Called It! Slot ${number}`;
  patchEditFormPresentation();
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
  scrubDotSeparators(participantsGrid);
}

function patchHistoryPresentation() {
  historyTableBody?.querySelectorAll('.history-prize').forEach(cell => {
    const text = cell.textContent.trim();
    if (/^\$\d/.test(text) && !/^\$0(?:\.00)?$/.test(text)) cell.textContent = `+${text}`;
  });
  scrubDotSeparators(historyTableBody);
}

participantsGrid?.addEventListener('click', event => {
  const pencil = event.target.closest('[data-play-edit-id]');
  if (!pencil) return;
  const number = slotNumber(pencil.closest('.play-slot'));
  if (!number) return;
  queueMicrotask(() => {
    if (editModal?.classList.contains('open') && editTitle) {
      editTitle.textContent = `Edit Called It! Slot ${number}`;
      const register = editSlots?.querySelector('.call-form-register');
      if (register) register.textContent = `CALLED IT! SLOT ${number}`;
      patchEditFormPresentation();
    }
  });
});

editSlots?.addEventListener('click', event => {
  if (event.target.closest('.ticker-result, [data-single-direction]')) {
    setTimeout(patchEditFormPresentation, 0);
  }
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

if (editSlots) {
  const editObserver = new MutationObserver(() => patchEditFormPresentation());
  editObserver.observe(editSlots, { childList: true, subtree: true, characterData: true });
}

scrubDotSeparators(document.body);
