import { getBackendClient } from './backend.js';

const form = document.getElementById('resetPasswordForm');
const passwordInput = document.getElementById('newPassword');
const confirmInput = document.getElementById('confirmPassword');
const message = document.getElementById('resetMessage');
const submit = document.getElementById('resetSubmit');
const flowType = new URLSearchParams(window.location.hash.slice(1)).get('type');
const supportedFlowAtLoad = flowType === 'recovery' || flowType === 'invite';
let passwordSetupReady = false;

function clearSecretsFromUrl() {
  if (!window.location.hash) return;
  window.history.replaceState(null, '', window.location.pathname);
}

function setReady() {
  passwordSetupReady = true;
  if (form) form.hidden = false;
  if (message) {
    message.textContent = flowType === 'invite'
      ? 'Choose a password to finish setting up this account.'
      : 'Choose a new password for this account.';
  }
  clearSecretsFromUrl();
  passwordInput?.focus();
}

function setUnavailable(text) {
  passwordSetupReady = false;
  if (form) form.hidden = true;
  if (message) message.textContent = text;
}

async function initialize() {
  try {
    const client = await getBackendClient();
    if (!client) {
      setUnavailable('Account setup is not available.');
      return;
    }

    client.auth.onAuthStateChange((event, session) => {
      if (!supportedFlowAtLoad || !session) return;
      if (flowType === 'recovery' && event === 'PASSWORD_RECOVERY') setReady();
      if (flowType === 'invite' && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) setReady();
    });

    const { data, error } = await client.auth.getSession();
    if (error) throw error;

    if (supportedFlowAtLoad && data.session) {
      setReady();
      return;
    }

    setUnavailable('Open a fresh invitation or password-reset link from your email.');
  } catch {
    setUnavailable('This account link could not be verified. Request a fresh email link.');
  }
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!passwordSetupReady) return;

  let password = String(passwordInput?.value || '');
  let confirmation = String(confirmInput?.value || '');

  if (!password || password !== confirmation) {
    if (message) message.textContent = 'The two password entries must match.';
    return;
  }

  const original = submit?.textContent || 'Save Password';
  if (submit) {
    submit.disabled = true;
    submit.textContent = 'Saving…';
  }

  try {
    const client = await getBackendClient();
    if (!client) throw new Error('Auth unavailable.');

    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;

    if (message) message.textContent = 'Password saved. You can return to Goblin Investing.';
    if (form) form.hidden = true;
    document.getElementById('resetDone')?.removeAttribute('hidden');
  } catch {
    if (message) message.textContent = 'Password could not be changed. Check the password requirements and try again.';
  } finally {
    if (passwordInput) passwordInput.value = '';
    if (confirmInput) confirmInput.value = '';
    password = '';
    confirmation = '';
    if (submit) {
      submit.disabled = false;
      submit.textContent = original;
    }
  }
});

window.addEventListener('pagehide', () => {
  if (passwordInput) passwordInput.value = '';
  if (confirmInput) confirmInput.value = '';
});

initialize();
