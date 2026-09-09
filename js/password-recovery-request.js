import { getBackendClient } from './backend.js';

const button = document.getElementById('forgotPasswordButton');
const emailInput = document.getElementById('authEmail');
const message = document.getElementById('authMessage');

button?.addEventListener('click', async () => {
  const email = String(emailInput?.value || '').trim();
  if (!email) {
    if (message) message.textContent = 'Enter your email first.';
    emailInput?.focus();
    return;
  }

  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Sending…';
  if (message) message.textContent = '';

  try {
    const client = await getBackendClient();
    if (!client) throw new Error('Auth is unavailable.');

    const siteRoot = new URL('./', window.location.href);
    siteRoot.hash = '';
    siteRoot.search = '';

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: siteRoot.href
    });

    if (error) throw error;
    if (message) message.textContent = 'If that email has an account, a reset link was sent.';
  } catch {
    if (message) message.textContent = 'Password reset email could not be sent.';
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
});
