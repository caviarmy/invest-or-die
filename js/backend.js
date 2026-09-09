let clientPromise = null;

export function getBackendConfig() {
  const url = document.querySelector('meta[name="goblin-supabase-url"]')?.content?.trim() || '';
  const publishableKey = document.querySelector('meta[name="goblin-supabase-publishable-key"]')?.content?.trim() || '';
  return { url, publishableKey, configured: Boolean(url && publishableKey) };
}

async function ownerEditThroughCalledIt(client, args = {}) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) return { data: null, error: sessionError };

  const session = sessionData.session;
  if (!session?.access_token) {
    return { data: null, error: new Error('Sign in to use Called It.') };
  }

  const config = getBackendConfig();
  if (!config.configured) {
    return { data: null, error: new Error('Called It is not configured.') };
  }

  try {
    const response = await fetch(`${config.url}/functions/v1/called-it`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': config.publishableKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'owner_edit',
        challenge_id: args.challenge_id,
        reason: args.new_reason,
        portfolio_action: args.new_portfolio_action,
        action_amount: args.new_action_amount
      })
    });

    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }

    if (!response.ok) {
      const error = new Error(body.error || 'Could not update the challenge.');
      error.status = response.status;
      return { data: null, error };
    }

    return { data: body.challenge || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getBackendClient() {
  const config = getBackendConfig();
  if (!config.configured) return null;

  if (!clientPromise) {
    clientPromise = Promise.resolve().then(() => {
      const createClient = globalThis.supabase?.createClient;
      if (typeof createClient !== 'function') {
        throw new Error('Supabase client library is unavailable.');
      }

      const client = createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });

      // Compatibility bridge: owner metadata edits use the server-authoritative
      // Called It Edge Function while the existing UI keeps its RPC-shaped call.
      const originalRpc = client.rpc.bind(client);
      client.rpc = (functionName, args, options) => {
        if (functionName === 'edit_own_called_it_metadata') {
          return ownerEditThroughCalledIt(client, args);
        }
        return originalRpc(functionName, args, options);
      };

      return client;
    });
  }

  return clientPromise;
}
