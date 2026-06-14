const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Fetching users from auth...');
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();

  if (fetchError) {
    console.error('Error listing auth users:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${users.length} auth users. Syncing to public.users...`);

  for (const u of users) {
    const name = u.user_metadata?.name || u.user_metadata?.display_name || 'Player';
    const { data: existing } = await supabase
      .from('users')
      .select('uid')
      .eq('uid', u.id)
      .single();

    if (existing) {
      console.log(`User ${u.email} already exists in public.users.`);
      continue;
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        uid: u.id,
        name: name,
        email: u.email,
        total_points: 0,
        is_admin: false,
        registered_at: u.created_at
      });

    if (insertError) {
      console.error(`Error inserting user ${u.email}:`, insertError);
    } else {
      console.log(`Synced user ${u.email} to public.users successfully.`);
    }
  }

  console.log('Sync complete!');
}

run();
