(() => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.get('type') !== 'recovery') return;

  // Supabase's implicit recovery flow returns credentials in the URL fragment.
  // Move them immediately to the dedicated reset page before the main app boots.
  const target = new URL('./reset-password/', window.location.href);
  target.hash = window.location.hash;
  window.location.replace(target.href);
})();
