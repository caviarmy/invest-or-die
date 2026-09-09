(() => {
  const form = document.getElementById('authForm');
  const password = document.getElementById('authPassword');
  const modal = document.getElementById('authModal');
  if (!form || !password || !modal) return;

  const clearPassword = () => {
    password.value = '';
  };

  // The application submit handler reads the field synchronously. Clear the DOM
  // copy immediately after the submit event finishes, regardless of success.
  form.addEventListener('submit', () => {
    queueMicrotask(clearPassword);
  });

  // Closing/cancelling the sign-in sheet must never leave a password in the DOM.
  const observer = new MutationObserver(() => {
    if (!modal.classList.contains('open') || modal.getAttribute('aria-hidden') === 'true') {
      clearPassword();
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });

  window.addEventListener('pagehide', clearPassword);
})();
