import { getBackendClient, getBackendConfig } from './backend.js';

export async function getSessionState() {
  const client = await getBackendClient();
  if (!client) return { configured: false, client: null, user: null, profile: null };

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user || null;
  if (!user) return { configured: true, client, user: null, profile: null };

  const { data: profile, error: profileError } = await client
    .from('participants')
    .select('user_id,display_name,sort_order,active,is_admin')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  return { configured: true, client, user, profile: profile || null };
}

export async function signIn(email, password) {
  const client = await getBackendClient();
  if (!client) return { ok: false, message: 'Editing is not available yet.' };
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: 'That email and password did not work.' };
  return { ok: true, message: '' };
}

export async function signOut() {
  const client = await getBackendClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export function backendIsConfigured() {
  return getBackendConfig().configured;
}
