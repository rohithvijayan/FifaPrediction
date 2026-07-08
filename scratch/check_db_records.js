const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabaseUrl = 'https://pcutnrrnsnqeulycktdo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdXRucnJuc25xZXVseWNrdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzYxNjAsImV4cCI6MjA5NTgxMjE2MH0.AtKrP3XUUFFK6pmQLeQLWfSzmgINpnyy94lVaIIcwiQ';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('knockout_stage_results')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("Total DB records:", data.length);
    data.forEach(r => {
      console.log(`Match ${r.match_number} (${r.stage}): ${r.home_team} (${r.home_team_code}) ${r.home_score} - ${r.away_score} ${r.away_team} (${r.away_team_code}) | status: ${r.status}`);
    });
  }
}

test();
