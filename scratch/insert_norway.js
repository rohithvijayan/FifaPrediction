const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let env = {};
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
} catch (e) {
  console.warn('Could not read .env.local, using process.env instead:', e.message);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Inserting Norway into database teams table...');
  const { data, error } = await supabase
    .from('teams')
    .insert([
      { name: 'Norway', code: 'NOR', flag_emoji: '🇳🇴', group_name: 'N' }
    ])
    .select();

  if (error) {
    if (error.code === '23505') {
      console.log('Norway already exists in the teams table.');
    } else {
      console.error('Error inserting Norway:', error);
    }
  } else {
    console.log('Successfully inserted Norway:', data);
  }
}

main();
