const { Groq } = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    console.log("Starting full Groq Cloud simulation test...");
    const apiKey = process.env.GROQ_API_KEY;
    const groq = new Groq({ apiKey });

    // Load fixtures
    const fixturesPath = path.join(__dirname, '../fixtures.json');
    const rawData = fs.readFileSync(fixturesPath, 'utf8');
    const fixturesData = JSON.parse(rawData);

    const allFixtures = fixturesData.fixtures || [];
    const knockoutFixtures = allFixtures.filter(f => f.stage && f.stage !== 'Group Stage');

    const systemPrompt = `You are a sports data assistant for the FIFA World Cup 2026 prediction platform.
The current date in our simulation timeline is July 8, 2026.
The tournament matches occur on these dates:
- Round of 32: June 29 to July 4, 2026. (These matches have finished)
- Round of 16: July 5 to July 8, 2026. (These matches have finished)
- Quarter-finals: July 10 to July 12, 2026. (Upcoming - not played yet)
- Semi-finals: July 15 to July 16, 2026. (Upcoming - not played yet)
- Third-Place Play-Off: July 19, 2026. (Upcoming - not played yet)
- Final: July 20, 2026. (Upcoming - not played yet)

Your task is to generate and simulate realistic results for the knockout stage matches based on this timeline:
1. For all Round of 32 matches (matchNumber 73 to 88):
   - Match 73 has a pre-determined result: "South Africa 0 – 1 Canada", so Canada is the winner. (Canada code is CAN, South Africa code is RSA/ZAF - use standard 3-letter codes).
   - For matches 74 to 88, simulate realistic scores (e.g. 2-1, 1-0, 0-0 etc.).
   - If a match is a draw, simulate penalty shootouts (e.g., set home_penalty_score and away_penalty_score).
   - Set status to 'FT' and construct the result_text (e.g. "Mexico 2 – 1 South Korea" or "Portugal 2(4) – 2(3) Croatia").
   - Populate home_team_code and away_team_code with correct 3-letter uppercase country codes (e.g. 'BRA', 'JPN', 'GER', 'PAR', 'NED', 'MAR', 'CIV', 'NOR', 'FRA', 'SWE', 'MEX', 'ECU', 'ENG', 'COD', 'BEL', 'SEN', 'USA', 'BIH', 'ESP', 'AUT', 'POR', 'CRO', 'SUI', 'ALG', 'AUS', 'EGY', 'ARG', 'CPV', 'COL', 'GHA').
2. For all Round of 16 matches (matchNumber 89 to 96):
   - Since these played between July 5-8, they have also finished.
   - Determine who qualified from the Round of 32 (matches 73-88) and pair them up in a logical bracket format:
     - Match 89: Winner 73 vs Winner 74
     - Match 90: Winner 75 vs Winner 76
     - Match 91: Winner 77 vs Winner 78
     - Match 92: Winner 79 vs Winner 80
     - Match 93: Winner 81 vs Winner 82
     - Match 94: Winner 83 vs Winner 84
     - Match 95: Winner 85 vs Winner 86
     - Match 96: Winner 87 vs Winner 88
   - Simulate realistic scores and penalties if draw.
   - Set status to 'FT' and construct result_text.
   - Populate home_team_code and away_team_code correctly with the qualified team codes.
3. For Quarter-finals (97-100), Semi-finals (101-102), Third-Place Play-Off (103), and Final (104):
   - These are upcoming. Set status to 'Upcoming'.
   - The teams are not determined yet, so set home_team to "TBD", away_team to "TBD".
   - Set home_team_code and away_team_code to "TBD".
   - Set home_score, away_score, home_penalty_score, and away_penalty_score to null.
   - Set result_text to null or "TBD".

Return the output strictly as a JSON object containing an array under the key "results". Each object in the array must match this schema:
{
  "match_number": "string (the match number, e.g. '73')",
  "stage": "string",
  "match_date": "string (YYYY-MM-DD format or matching fixtures.json)",
  "match_time": "string (e.g. '12:30 AM')",
  "fixture": "string (e.g. 'Home Team vs Away Team')",
  "home_team": "string",
  "home_team_code": "string (3-letter uppercase country code)",
  "away_team": "string",
  "away_team_code": "string (3-letter uppercase country code)",
  "home_score": number or null,
  "away_score": number or null,
  "home_penalty_score": number or null,
  "away_penalty_score": number or null,
  "status": "string ('FT' or 'Upcoming')",
  "venue": "string",
  "result_text": "string or null"
}`;

    const userPrompt = `Here is the knockout fixtures definition from our database/JSON:
${JSON.stringify(knockoutFixtures, null, 2)}

Please generate the complete simulated knockout stage results as specified. Remember, today is July 8, 2026. Therefore, Round of 32 and Round of 16 matches are 'FT', while Quarter-finals, Semis, and Finals are 'Upcoming' with 'TBD' teams. Make sure team codes/names are consistent and realistic.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);

    if (parsed && parsed.results) {
      console.log(`\nSuccess! Simulated ${parsed.results.length} matches.`);

      // Let's filter some finished ones to show code matching
      const finished = parsed.results.filter(m => m.status === 'FT');
      console.log(`\nFinished Matches Sample (Total Finished: ${finished.length}):`);
      console.log(JSON.stringify(finished.slice(0, 5), null, 2));

      // Let's check a TBD match
      const upcoming = parsed.results.filter(m => m.status === 'Upcoming');
      console.log(`\nUpcoming Matches Sample (Total Upcoming: ${upcoming.length}):`);
      console.log(JSON.stringify(upcoming.slice(0, 3), null, 2));
    } else {
      console.error("Error: response did not match expected structure.");
    }
  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

test();
