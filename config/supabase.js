const { createClient } = require('@supabase/supabase-js');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('🔧 Supabase Configuration Check:');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('🔧 SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('🔧 SUPABASE_URL value:', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'undefined');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

try {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl ? supabaseUrl.length : 0,
      keyLength: supabaseKey ? supabaseKey.length : 0
    });
    throw new Error('Missing Supabase environment variables');
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message);
  console.error('❌ Error stack:', error.stack);
  // Create a mock client that throws errors for all operations
  supabase = {
    from: () => ({
      select: () => Promise.reject(new Error('Supabase not configured')),
      insert: () => Promise.reject(new Error('Supabase not configured')),
      update: () => Promise.reject(new Error('Supabase not configured')),
      delete: () => Promise.reject(new Error('Supabase not configured'))
    })
  };
}

module.exports = supabase;