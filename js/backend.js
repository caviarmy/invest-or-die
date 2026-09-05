let clientPromise = null;

export function getBackendConfig() {
  const url = document.querySelector('meta[name="goblin-supabase-url"]')?.content?.trim() || '';
  const publishableKey = document.querySelector('meta[name="goblin-supabase-publishable-key"]')?.content?.trim() || '';
  return { url, publishableKey, configured: Boolean(url && publishableKey) };
}

export async function getBackendClient() {
  const config = getBackendConfig();
  if (!config.configured) return null;
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({ createClient }) =>
      createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    );
  }
  return clientPromise;
}
