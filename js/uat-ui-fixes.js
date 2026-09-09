import { getBackendClient } from './backend.js';
import { calledItRequest } from './market.js';

const participantsGrid = document.getElementById('participantsGrid');
const editMyPlaysButton = document.getElementById('editMyPlaysButton');
const editModal = document.getElementById('editModal');
const editSlots = document.getElementById('editSlots');
const editTitle = document.getElementById('editTitle');
const editMessage = document.getElementById('editMessage');
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

function decorateGoal(form) {
  const goal = form?.querySelector('[data-single-goal]');
  const direction = form?.elements?.direction?.value || '';
  if (!goal || !direction || goal.querySelector('.uat-goal-price')) return;

  const text = goal.textContent.trim();
  const prices = text.match(/\$[\d,.]+/g) || [];
  if ((direction === 'up' || direction === 'down') && prices.length < 1) return;
  if (direction === 'flat' && prices.length < 2) return;

  const price = direction === 'flat' ? `${prices[0]}–${prices[1]}` : prices[0];
  const qualifier = direction === 'up' ? 'AT LEAST' : direction === 'down' ? 'AT MOST' : 'BETWEEN';
  const tail = direction === 'up' ? 'OR MORE!' : direction === 'down' ? 'OR LESS!' : 'AT THE END';

  goal.classList.remove('uat-goal-up', 'uat-goal-down', 'uat-goal-flat');
  goal.classList.add('uat-goal-card', `uat-goal-${direction}`);
  goal.innerHTML = `<span class="uat-goal-to">TO</span><span class="uat-goal-qualifier">${qualifier}</span><strong class="uat-goal-price">${price}</strong><span class="uat-goal-tail">${tail}</span>`;
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

function minimumForAction(action) {
  return action === 'buy' ? 5 : 0.01;
}

function setAllAmount(form, active) {
  const amountInput = form?.elements?.action_amount;
  const stepper = form?.querySelector('.uat-amount-stepper');
  const allButton = stepper?.querySelector('.uat-amount-all');
  if (!amountInput || !stepper || !allButton) return;

  if (active) {
    if (amountInput.value) form.dataset.lastNumericAmount = amountInput.value;
    form.dataset.amountAll = 'true';
    amountInput.required = false;
    amountInput.disabled = true;
    amountInput.value = '';
    stepper.classList.add('is-all');
    allButton.classList.add('active');
    allButton.setAttribute('aria-pressed', 'true');
  } else {
    form.dataset.amountAll = 'false';
    amountInput.disabled = false;
    if (!amountInput.value) amountInput.value = form.dataset.lastNumericAmount || '5.00';
    stepper.classList.remove('is-all');
    allButton.classList.remove('active');
    allButton.setAttribute('aria-pressed', 'false');
  }
}

function syncAmountPresentation(form) {
  const action = form?.elements?.portfolio_action?.value || '';
  const amountInput = form?.elements?.action_amount;
  const amountWrap = form?.querySelector('.amount-wrap');
  const stepper = form?.querySelector('.uat-amount-stepper');
  const allButton = stepper?.querySelector('.uat-amount-all');
  if (!amountInput || !amountWrap || !stepper || !allButton) return;

  const showAmount = action === 'buy' || action === 'sell';
  stepper.hidden = !showAmount;
  amountWrap.hidden = !showAmount;

  if (!showAmount) {
    form.dataset.amountAll = 'false';
    amountInput.required = false;
    amountInput.disabled = false;
    allButton.hidden = true;
    stepper.classList.remove('is-all');
    return;
  }

  const minimum = minimumForAction(action);
  amountInput.min = String(minimum);
  amountInput.step = '0.01';
  amountInput.inputMode = 'decimal';
  allButton.hidden = action !== 'sell';

  if (action === 'buy') {
    setAllAmount(form, false);
    const numeric = Number(amountInput.value);
    amountInput.value = (Number.isFinite(numeric) ? Math.max(5, numeric) : 5).toFixed(2);
    amountInput.required = true;
    return;
  }

  const allActive = form.dataset.amountAll === 'true';
  if (allActive) {
    setAllAmount(form, true);
    return;
  }

  setAllAmount(form, false);
  const numeric = Number(amountInput.value);
  amountInput.value = (Number.isFinite(numeric) && numeric > 0 ? numeric : 5).toFixed(2);
  amountInput.required = true;
}

function enhanceAmountStepper(form) {
  const amountInput = form?.elements?.action_amount;
  const amountWrap = form?.querySelector('.amount-wrap');
  if (!amountInput || !amountWrap) return;

  let stepper = amountWrap.closest('.uat-amount-stepper');
  if (!stepper) {
    stepper = document.createElement('div');
    stepper.className = 'uat-amount-stepper';
    amountWrap.before(stepper);
    stepper.append(amountWrap);

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = 'uat-amount-all';
    allButton.textContent = 'ALL';
    allButton.setAttribute('aria-label', 'Sell all');
    allButton.setAttribute('aria-pressed', 'false');
    allButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      setAllAmount(form, form.dataset.amountAll !== 'true');
      syncAmountPresentation(form);
    });
    stepper.append(allButton);

    const controls = document.createElement('div');
    controls.className = 'uat-amount-step-controls';

    const makeStepButton = (delta, label, text) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'uat-amount-step';
      button.setAttribute('aria-label', label);
      button.textContent = text;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const action = form.elements.portfolio_action?.value || '';
        if (form.dataset.amountAll === 'true') {
          form.dataset.lastNumericAmount = '5.00';
          setAllAmount(form, false);
        }
        const minimum = minimumForAction(action);
        const current = Number(amountInput.value);
        const base = Number.isFinite(current) ? current : 5;
        const next = Math.max(minimum, base + delta);
        amountInput.value = next.toFixed(2);
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
        amountInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return button;
    };

    controls.append(
      makeStepButton(1, 'Increase amount by one dollar', '▲'),
      makeStepButton(-1, 'Decrease amount by one dollar', '▼')
    );
    stepper.append(controls);

    amountInput.addEventListener('input', () => {
      if (form.dataset.amountAll === 'true') setAllAmount(form, false);
    });
    amountInput.addEventListener('blur', () => {
      if (form.dataset.amountAll === 'true' || stepper.hidden) return;
      const action = form.elements.portfolio_action?.value || '';
      const minimum = minimumForAction(action);
      const numeric = Number(amountInput.value);
      amountInput.value = (Number.isFinite(numeric) ? Math.max(minimum, numeric) : Math.max(5, minimum)).toFixed(2);
    });
  }

  amountInput.setAttribute('aria-label', 'Dollar amount');
  syncAmountPresentation(form);
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
  decorateGoal(form);

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

function patchMoveCopy(slot) {
  slot.querySelectorAll('.play-copy').forEach(block => {
    const label = block.querySelector('strong')?.textContent.trim().toUpperCase();
    const value = block.querySelector('div');
    if (label !== 'MY MOVE' || !value) return;
    const text = value.textContent.trim();
    if (/^Selling\s*(?:·|\/)\s*amount unavailable$/i.test(text)) value.textContent = 'Selling All';
    if (/^Holding\s*(?:·|\/)\s*amount unavailable$/i.test(text)) value.textContent = 'Holding';
  });
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

      patchMoveCopy(slot);

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

function flexibleActionAmount(form, action) {
  if (action === 'hold' || action === 'not_buying') return null;
  if (action !== 'sell') return undefined;
  if (form.dataset.amountAll === 'true') return null;
  const raw = String(form.elements.action_amount?.value || '').trim();
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a sell amount or choose All.');
  return Number(amount.toFixed(2));
}

async function submitFlexibleAction(form) {
  const action = form.elements.portfolio_action?.value || '';
  const amount = flexibleActionAmount(form, action);
  const mode = form.dataset.mode;
  const client = await getBackendClient();
  if (!client) throw new Error('Sign in to save this challenge.');

  const reason = form.elements.reason?.value || '';
  if (mode === 'owner-edit') {
    return calledItRequest(client, 'owner_edit', {
      challenge_id: form.dataset.challengeId,
      reason,
      portfolio_action: action,
      action_amount: amount
    });
  }

  const ticker = form.elements.ticker?.value || '';
  const direction = form.elements.direction?.value || '';
  if (!ticker) throw new Error('Choose a stock from the search results.');
  if (!direction) throw new Error('Choose Go Up, Go Down, or Finish About the Same.');

  const payload = {
    owner_id: form.dataset.ownerId || undefined,
    slot_number: Number(form.dataset.slot),
    ticker,
    direction,
    reason,
    portfolio_action: action,
    action_amount: amount
  };

  if (mode === 'admin-edit') {
    return calledItRequest(client, 'admin_edit', {
      challenge_id: form.dataset.challengeId,
      ...payload
    });
  }
  return calledItRequest(client, 'create', payload);
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

editSlots?.addEventListener('change', event => {
  const form = event.target.closest('.single-called-it-form');
  if (!form) return;
  if (event.target.name === 'portfolio_action') {
    setTimeout(() => {
      simplifyActionOptions(form.elements.portfolio_action);
      syncAmountPresentation(form);
    }, 0);
  }
});

editSlots?.addEventListener('submit', async event => {
  const form = event.target.closest('.single-called-it-form');
  if (!form) return;
  const action = form.elements.portfolio_action?.value || '';
  if (action === 'buy') return;

  event.preventDefault();
  event.stopPropagation();

  const submit = form.querySelector('button[type="submit"]');
  try {
    if (submit) submit.disabled = true;
    if (editMessage) {
      editMessage.className = 'form-message';
      editMessage.textContent = 'Saving…';
    }
    await submitFlexibleAction(form);
    window.location.reload();
  } catch (error) {
    if (editMessage) {
      editMessage.className = 'form-message error';
      editMessage.textContent = error.message || 'Could not save the challenge.';
    }
    if (submit) submit.disabled = false;
  }
}, true);

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
