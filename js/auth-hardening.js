(() => {
  const authParams = new URLSearchParams(window.location.hash.slice(1));
  const authFlowType = authParams.get('type');
  if (authFlowType === 'recovery' || authFlowType === 'invite') {
    const target = new URL('./reset-password/', window.location.href);
    target.hash = window.location.hash;
    window.location.replace(target.href);
    return;
  }

  const form = document.getElementById('authForm');
  const password = document.getElementById('authPassword');
  const modal = document.getElementById('authModal');
  if (!form || !password || !modal) return;

  const clearPassword = () => {
    password.value = '';
  };

  // The application submit handler captures the password synchronously when the
  // submit event reaches it. Clear the DOM copy on the next task, not a microtask:
  // some browsers may run the microtask before the app's separately registered
  // submit listener, which would cause an empty password to be sent to Supabase.
  form.addEventListener('submit', () => {
    window.setTimeout(clearPassword, 0);
  });

  // Closing/cancelling the sign-in sheet must never leave a password in the DOM.
  const observer = new MutationObserver(() => {
    if (!modal.classList.contains('open') || modal.getAttribute('aria-hidden') === 'true') {
      clearPassword();
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });

  window.addEventListener('pagehide', clearPassword);

  // Add a recovery action without changing the auth form's native submission
  // behavior. The actual request remains in a same-origin module.
  const submit = form.querySelector('button[type="submit"]');
  if (submit && !document.getElementById('forgotPasswordButton')) {
    const forgot = document.createElement('button');
    forgot.id = 'forgotPasswordButton';
    forgot.type = 'button';
    forgot.className = 'text-button auth-recovery-button';
    forgot.textContent = 'Forgot password?';
    submit.insertAdjacentElement('afterend', forgot);

    const scriptUrl = document.currentScript?.src || window.location.href;
    const moduleUrl = new URL('./password-recovery-request.js', scriptUrl).href;
    import(moduleUrl).catch(() => {
      forgot.disabled = true;
    });
  }
})();
