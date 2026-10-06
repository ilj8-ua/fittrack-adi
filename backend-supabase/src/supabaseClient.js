import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

let defaultClient = null;

export function getSupabaseClient(customUrl = null, customKey = null) {
  if (customUrl && customKey) {
    return createClient(customUrl, customKey);
  }

  if (!defaultClient) {
    defaultClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  return defaultClient;
}

export function setCustomClient(client) {
  defaultClient = client;
}

export default getSupabaseClient;
