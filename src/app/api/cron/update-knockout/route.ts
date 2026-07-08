import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import { Groq } from 'groq-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Verify cron secret key to secure the endpoint
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');

    // Check Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');
    const headerSecret = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

    const secret = querySecret || headerSecret;
    const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Read fixtures.json to get the base tournament structure
    const fixturesPath = path.join(process.cwd(), 'fixtures.json');
    let fixturesData;
    try {
      const rawData = fs.readFileSync(fixturesPath, 'utf8');
      fixturesData = JSON.parse(rawData);
    } catch (err) {
      console.error('Error reading fixtures.json:', err);
      throw new Error('Failed to read fixtures configuration file.');
    }

    const allFixtures = fixturesData.fixtures || [];
    const knockoutFixtures = allFixtures.filter((f: any) =>
      f.stage && f.stage !== 'Group Stage'
    );

    // 3. Initialize Groq SDK
    const groqApiKey = process.env.GROQ_API_KEY;
    const groq = new Groq({ apiKey: groqApiKey });

    const systemPrompt = `You are a sports data assistant for the FIFA World Cup 2026 prediction platform.
The current date in our simulation timeline is July 8, 2026.
The tournament matches occur on these dates:
- Round of 32: June 29 to July 4, 2026. (These matches have finished)
- Round of 16: July 5 to July 8, 2026. (These matches have finished)
- Quarter-finals: July 10 to July 12, 2026. (Upcoming - not played yet)
- Semi-finals: July 15 to July 16, 2026. (Upcoming - not played yet)
- Third-Place Play-Off: July 19, 2026. (Upcoming - not played yet)
- Final: July 20, 2026. (Upcoming - not played yet)

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
   - Match 73 has a pre-determined result: "South Africa 0 – 1 Canada", so Canada is the winner. (Canada code is CAN, South Africa code is RSA/ZAF - use standard 3-letter codes).
   - For matches 74 to 88, simulate realistic scores (e.g. 2-1, 1-0, 0-0 etc.).
   - If a match is a draw, simulate penalty shootouts (e.g., set home_penalty_score and away_penalty_score).
   - Set status to 'FT' and construct the result_text (e.g. "Mexico 2 – 1 South Korea" or "Portugal 2(4) – 2(3) Croatia").
   - Populate home_team_code and away_team_code with correct 3-letter uppercase country codes (e.g. 'BRA', 'JPN', 'GER', 'PAR', 'NED', 'MAR', 'CIV', 'NOR', 'FRA', 'SWE', 'MEX', 'ECU', 'ENG', 'COD', 'BEL', 'SEN', 'USA', 'BIH', 'ESP', 'AUT', 'POR', 'CRO', 'SUI', 'ALG', 'AUS', 'EGY', 'ARG', 'CPV', 'COL', 'GHA').
2. For all Round of 16 matches (89 to 96):
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

Please generate the complete simulated knockout stage results as specified. You must generate all 32 matches individually (73 to 104 inclusive). Remember, today is July 8, 2026. Therefore, Round of 32 and Round of 16 matches are 'FT', while Quarter-finals, Semis, and Finals are 'Upcoming' with 'TBD' teams. Make sure team codes/names are consistent and realistic.`;

    console.log('Querying Groq Cloud...');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message?.content || '{}';
    const parsedData = JSON.parse(responseContent);
    const simulatedResults = parsedData.results || [];

    if (simulatedResults.length === 0) {
      throw new Error('Groq returned an empty results list.');
    }

    // 4. Connect to Supabase
    const supabaseAdmin = createAdminClient();

    // 5. Upsert results into database
    const mappedResults = simulatedResults.map((item: any) => ({
      match_number: String(item.match_number),
      stage: item.stage,
      match_date: item.match_date,
      match_time: item.match_time,
      fixture: item.fixture,
      home_team: item.home_team,
      home_team_code: item.home_team_code ? String(item.home_team_code).toUpperCase() : 'TBD',
      away_team: item.away_team,
      away_team_code: item.away_team_code ? String(item.away_team_code).toUpperCase() : 'TBD',
      home_score: item.home_score !== undefined ? item.home_score : null,
      away_score: item.away_score !== undefined ? item.away_score : null,
      home_penalty_score: item.home_penalty_score !== undefined ? item.home_penalty_score : null,
      away_penalty_score: item.away_penalty_score !== undefined ? item.away_penalty_score : null,
      status: item.status,
      venue: item.venue,
      result_text: item.result_text,
      updated_at: new Date().toISOString()
    }));

    const { error: dbError } = await supabaseAdmin
      .from('knockout_stage_results')
      .upsert(mappedResults, { onConflict: 'match_number' });

    if (dbError) {
      console.warn('Could not save knockout results to DB:', dbError.message);
      return NextResponse.json({
        success: true,
        message: 'Fetched and simulated knockout results successfully, but failed to save to DB (table might not exist).',
        data: mappedResults
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully simulated and updated ${mappedResults.length} knockout stage matches in DB.`,
      data: mappedResults
    });

  } catch (err: any) {
    console.error('Update Knockout error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
