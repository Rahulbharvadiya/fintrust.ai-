// Official Supabase Client Integration & Health Check
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = require('../config');

let supabase = null;
let isConfigured = false;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isConfigured = true;
    console.log('[Supabase Client] Successfully initialized with URL:', SUPABASE_URL);
  } catch (err) {
    console.error('[Supabase Client] Initialization failed:', err.message);
  }
} else {
  console.log('[Supabase Client] Credentials not provided. Running on High-Efficiency In-Memory Data Engine with Seed Datasets.');
}

async function checkSupabaseHealth() {
  if (!isConfigured || !supabase) {
    return {
      connected: false,
      mode: 'IN_MEMORY_ADAPTER_ACTIVE',
      url: null,
      message: 'Running local in-memory fallback. Add SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY to connect to live Supabase.'
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return {
      connected: true,
      mode: 'SUPABASE_CLOUD_POSTGRES',
      url: SUPABASE_URL,
      message: 'Connected to live Supabase PostgreSQL database.'
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'SUPABASE_CONNECTION_ERROR',
      error: err.message
    };
  }
}

module.exports = {
  supabase,
  isConfigured,
  checkSupabaseHealth
};
