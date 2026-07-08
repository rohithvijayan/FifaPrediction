const { Groq } = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const NAME_TO_CODE_3 = {
  'South Africa': 'RSA',
  'Canada': 'CAN',
  'Brazil': 'BRA',
  'Japan': 'JPN',
  'Germany': 'GER',
  'Paraguay': 'PAR',
  'Netherlands': 'NED',
  'Morocco': 'MAR',
  'Ivory Coast': 'CIV',
  'Norway': 'NOR',
  'France': 'FRA',
  'Sweden': 'SWE',
  'Mexico': 'MEX',
  'Ecuador': 'ECU',
  'England': 'ENG',
  'DR Congo': 'COD',
  'Belgium': 'BEL',
  'Senegal': 'SEN',
  'USA': 'USA',
  'United States': 'USA',
  'Bosnia and Herzegovina': 'BIH',
  'Spain': 'ESP',
  'Austria': 'AUT',
  'Portugal': 'POR',
  'Croatia': 'CRO',
  'Switzerland': 'SUI',
  'Algeria': 'ALG',
  'Australia': 'AUS',
  'Egypt': 'EGY',
  'Argentina': 'ARG',
  'Cape Verde': 'CPV',
  'Colombia': 'COL',
  'Ghana': 'GHA'
};

async function test() {
  try {
    console.log("Fetching full 32-match simulation from Groq using compact JSON format...");
    const apiKey = process.env.GROQ_API_KEY || '***REMOVED***';
    const groq = new Groq({ apiKey });

    // Load fixtures
    const fixturesPath = path.join(__dirname, '../fixtures.json');
    const rawData = fs.readFileSync(fixturesPath, 'utf8');
    const fixturesData = JSON.parse(rawData);
    
    const allFixtures = fixturesData.fixtures || [];
    const knockoutFixtures = allFixtures.filter(f => f.stage && f.stage !== 'Group Stage');

    // Expand fixtures to 32 individual match objects
    const expandedFixtures = [];
    for (const f of knockoutFixtures) {
      const numStr = String(f.matchNumber);
      if (numStr.includes('-')) {
        const [start, end] = numStr.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          expandedFixtures.push({
            matchNumber: i,
            stage: f.stage,
            date: f.date,
            time: f.time,
            fixture: f.fixture,
            venue: f.venue || 'TBD Venue',
            status: 'Upcoming',
            result: null
          });
        }
      } else {
        expandedFixtures.push({
          matchNumber: Number(f.matchNumber),
          stage: f.stage,
          date: f.date,
          time: f.time,
          fixture: f.fixture,
          venue: f.venue || 'TBD Venue',
          status: f.status || 'Upcoming',
          result: f.result || null
        });
      }
    }
    expandedFixtures.sort((a, b) => a.matchNumber - b.matchNumber);

    const systemPrompt = `You are a sports data assistant for the FIFA World Cup 2026 prediction platform.
The current date in our simulation timeline is July 8, 2026.
Your task is to generate and simulate realistic results for the knockout stage.
You MUST output EXACTLY 32 individual matches in your response array:
- 16 matches for Round of 32 (match_numbers: 73 to 88)
- 8 matches for Round of 16 (match_numbers: 89 to 96)
- 4 matches for Quarter-finals (match_numbers: 97 to 100)
- 2 matches for Semi-finals (match_numbers: 101 to 102)
- 1 match for Third-Place Play-Off (match_number: 103)
- 1 match for Final (match_number: 104)

Simulation Rules:
1. For all Round of 32 matches (73 to 88):
   - Match 73 has a pre-determined result: "South Africa 0 – 1 Canada", so Canada is the winner. (Canada code is CAN, South Africa code is RSA/ZAF).
   - For matches 74 to 88, simulate realistic scores (e.g. 2-1, 1-0, 0-0 etc.).
   - If a match is a draw, simulate penalty shootouts (e.g., set home_penalty_score and away_penalty_score).
   - Set status to 'FT' and construct the result_text (e.g. "Mexico 2 – 1 South Korea" or "Portugal 2(4) – 2(3) Croatia").
2. For all Round of 16 matches (89 to 96):
   - Since these played between July 5-8, they have also finished. Set status to 'FT'.
   - Determine who qualified from the Round of 32 (matches 73-88) and pair them up in a logical bracket format matching the official FIFA World Cup 2026 structure:
     - Match 89: Winner 73 vs Winner 76
     - Match 90: Winner 75 vs Winner 78
     - Match 91: Winner 74 vs Winner 77
     - Match 92: Winner 79 vs Winner 80
     - Match 93: Winner 84 vs Winner 83
     - Match 94: Winner 82 vs Winner 81
     - Match 95: Winner 87 vs Winner 86
     - Match 96: Winner 85 vs Winner 88
   - Simulate realistic scores and penalties if draw.
   - Set status to 'FT' and construct result_text.
3. For Quarter-finals (97-100), Semi-finals (101-102), Third-Place Play-Off (103), and Final (104):
   - These are upcoming. Set status to 'Upcoming'.
   - The teams are not determined yet, so set home_team to "TBD", away_team to "TBD".
   - Set home_team_code and away_team_code to "TBD".
   - Set home_score, away_score, home_penalty_score, and away_penalty_score to null.
   - Set result_text to null.

Return the output strictly as a JSON object containing an array under the key "results". Each object in the array must match this schema exactly:
{
  "match_number": number,
  "home_team": "string",
  "home_team_code": "string (3-letter uppercase country code)",
  "away_team": "string",
  "away_team_code": "string (3-letter uppercase country code)",
  "home_score": number or null,
  "away_score": number or null,
  "home_penalty_score": number or null,
  "away_penalty_score": number or null,
  "status": "string ('FT' or 'Upcoming')",
  "result_text": "string or null"
}`;

    const userPrompt = `Here is the template list of 32 individual knockout stage matches:
${JSON.stringify(expandedFixtures.map(f => {
  let home_team = 'TBD';
  let home_team_code = 'TBD';
  let away_team = 'TBD';
  let away_team_code = 'TBD';
  if (f.fixture && f.fixture !== 'TBD') {
    const parts = f.fixture.split(' vs ');
    if (parts.length === 2) {
      home_team = parts[0].trim();
      away_team = parts[1].trim();
      home_team_code = NAME_TO_CODE_3[home_team] || 'TBD';
      away_team_code = NAME_TO_CODE_3[away_team] || 'TBD';
    }
  }
  return {
    match_number: f.matchNumber,
    stage: f.stage,
    fixture: f.fixture,
    home_team,
    home_team_code,
    away_team,
    away_team_code,
    status: f.status
  };
}), null, 2)}

Please fill in the simulated results for this exact list of matches. Return all 32 matches in the results array.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);
    const simulatedResults = parsed.results || [];
    
    console.log("Total generated matches:", simulatedResults.length);

    // Merge logic
    const simulatedMap = new Map();
    for (const sim of simulatedResults) {
      simulatedMap.set(Number(sim.match_number), sim);
    }

    const mappedResults = expandedFixtures.map(f => {
      const sim = simulatedMap.get(f.matchNumber);
      
      let home_team = 'TBD';
      let home_team_code = 'TBD';
      let away_team = 'TBD';
      let away_team_code = 'TBD';
      if (f.fixture && f.fixture !== 'TBD') {
        const parts = f.fixture.split(' vs ');
        if (parts.length === 2) {
          home_team = parts[0].trim();
          away_team = parts[1].trim();
          home_team_code = NAME_TO_CODE_3[home_team] || 'TBD';
          away_team_code = NAME_TO_CODE_3[away_team] || 'TBD';
        }
      }

      let home_score = null;
      let away_score = null;
      let home_penalty_score = null;
      let away_penalty_score = null;
      let status = 'Upcoming';
      let result_text = null;

      if (sim) {
        home_team = sim.home_team || home_team;
        home_team_code = sim.home_team_code || home_team_code;
        away_team = sim.away_team || away_team;
        away_team_code = sim.away_team_code || away_team_code;
        home_score = sim.home_score !== undefined ? sim.home_score : null;
        away_score = sim.away_score !== undefined ? sim.away_score : null;
        home_penalty_score = sim.home_penalty_score !== undefined ? sim.home_penalty_score : null;
        away_penalty_score = sim.away_penalty_score !== undefined ? sim.away_penalty_score : null;
        status = sim.status || status;
        result_text = sim.result_text || result_text;
      }

      return {
        match_number: String(f.matchNumber),
        stage: f.stage,
        match_date: f.date,
        match_time: f.time,
        fixture: `${home_team} vs ${away_team}`,
        home_team,
        home_team_code: home_team_code.toUpperCase(),
        away_team,
        away_team_code: away_team_code.toUpperCase(),
        home_score,
        away_score,
        home_penalty_score,
        away_penalty_score,
        status,
        venue: f.venue,
        result_text
      };
    });

    console.log("Total merged matches:", mappedResults.length);
    mappedResults.forEach(m => {
      console.log(`Match ${m.match_number} (${m.stage}): ${m.home_team} (${m.home_team_code}) ${m.home_score} - ${m.away_score} ${m.away_team} (${m.away_team_code}) | status: ${m.status} | result_text: ${m.result_text}`);
    });

  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
