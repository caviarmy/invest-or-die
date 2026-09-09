import { getBackendClient } from './backend.js';

const form = document.getElementById('resetPasswordForm');
const passwordInput = document.getElementById('newPassword');
const confirmInput = document.getElementById('confirmPassword');
const message = document.getElementById('resetMessage');
const submit = document.getElementById('resetSubmit');
const recoveryAtLoad = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
let recoveryReady = false;

function clearSecretsFromUrl() {
  if (!window.location.hash) return;
  window.history.replaceState(null, '', window.location.pathname);
}

function setReady() {
  recoveryReady = true;
  if (form) form.hidden = false;
  if (message) message.textContent = 'Choose a new password for this account.';
  clearSecretsFromUrl();
  passwordInput?.focus();
}

function setUnavailable(text) {
  recoveryReady = false;
  if (form) form.hidden = true;
  if (message) message.textContent = text;
}

async function initialize() {
  try {
    const client = await getBackendClient();
    if (!client) {
      setUnavailable('Password recovery is not available.');
      return;
    }

    client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) setReady();
    });

    const { data, error } = await client.auth.getSession();
    if (error) throw error;

    if (recoveryAtLoad && data.session) {
      setReady();
      return;
    }

    setUnavailable('Open a fresh password-reset link from your email.');
  } catch {
    setUnavailable('This password-reset link could not be verified. Request a new one.');
  }
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!recoveryReady) return;

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

    if (message) message.textContent = 'Password updated. You can return to Goblin Investing.';
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
