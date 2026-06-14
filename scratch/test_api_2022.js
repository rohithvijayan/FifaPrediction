const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const apiKey = env.FOOTBALL_API_KEY;
if (!apiKey) {
  console.error("FOOTBALL_API_KEY is not defined in .env.local");
  process.exit(1);
}

const url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2022&date=2026-06-03';

console.log("Fetching 2022 World Cup fixtures for 2022-11-23...");
fetch(url, {
  headers: {
    'x-apisports-key': apiKey
  }
})
.then(res => res.json())
.then(data => {
  console.log("Response status:", data.errors ? "Has errors" : "OK");
  if (data.errors && Object.keys(data.errors).length > 0) {
    console.error("Errors:", data.errors);
  } else {
    console.log("Success! Found fixtures:", data.results);
    if (data.response && data.response.length > 0) {
      data.response.forEach(item => {
        console.log(`- [${item.fixture.id}] ${item.teams.home.name} vs ${item.teams.away.name} (Score: ${item.goals.home}-${item.goals.away}, Status: ${item.fixture.status.short})`);
      });
    }
  }
})
.catch(err => {
  console.error("Fetch failed:", err);
});
