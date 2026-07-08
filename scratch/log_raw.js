const { Groq } = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
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

Return the output strictly as a JSON object containing an array under the key "results". Each object in the array must match this schema exactly:
{
  "match_number": "string",
  "stage": "string",
  "match_date": "string",
  "match_time": "string",
  "fixture": "string",
  "home_team": "string",
  "home_team_code": "string",
  "away_team": "string",
  "away_team_code": "string",
  "home_score": number or null,
  "away_score": number or null,
  "home_penalty_score": number or null,
  "away_penalty_score": number or null,
  "status": "string",
  "venue": "string",
  "result_text": "string or null"
}`;

    const userPrompt = `Here is the template list of 32 individual knockout stage matches:
${JSON.stringify(expandedFixtures, null, 2)}

Please fill in the simulated results for this exact list of matches.
For matches 73 to 96 (Round of 32 and Round of 16), which are played on or before July 8, 2026, you MUST:
- Retain the exact match_number and stage.
- For matches 73 to 88, simulate realistic scores and penalty shootouts (if drawn). Do NOT change the team names or country codes that are already set in matches 73 to 88.
- For matches 89 to 96 (Round of 16), determine the home and away teams based on who won the corresponding Round of 32 matches using the official bracket tree:
  - Match 89: Winner 73 vs Winner 76
  - Match 90: Winner 75 vs Winner 78
  - Match 91: Winner 74 vs Winner 77
  - Match 92: Winner 79 vs Winner 80
  - Match 93: Winner 84 vs Winner 83
  - Match 94: Winner 82 vs Winner 81
  - Match 95: Winner 87 vs Winner 86
  - Match 96: Winner 85 vs Winner 88
  - Simulate realistic scores and penalty shootouts (if drawn) for matches 89 to 96. Set status to 'FT' and construct the result_text.
- For matches 97 to 104 (Quarter-finals to Final), which are played after July 8, 2026, set status to 'Upcoming', home_team to 'TBD', home_team_code to 'TBD', away_team to 'TBD', away_team_code to 'TBD', home_score to null, away_score to null, home_penalty_score to null, away_penalty_score to null, result_text to null.

You must return all 32 matches in your JSON results array, from 73 to 104 in order. Do not skip any match.`;

    console.log("Querying Groq...");
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
    fs.writeFileSync(path.join(__dirname, 'raw_response.json'), content);
    console.log("Saved response to scratch/raw_response.json");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
