import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface FifastandingResult {
  Group: Array<{ Locale: string; Description: string }>;
  Played: number;
  Won: number;
  Drawn: number;
  Lost: number;
  For: number;
  Against: number;
  GoalsDiference: number;
  Points: number;
  Position: number;
  Team: {
    Abbreviation: string;
    ShortClubName?: string;
    Name?: Array<{ Locale: string; Description: string }>;
  };
}

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

    // 2. Fetch data from FIFA standings API
    const fifaUrl = 'https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200';
    console.log('Fetching FIFA standings from:', fifaUrl);
    
    const fifaRes = await fetch(fifaUrl, {
      next: { revalidate: 0 } // Bypass Next.js cache
    });

    if (!fifaRes.ok) {
      throw new Error(`Failed to fetch FIFA standings: ${fifaRes.statusText}`);
    }

    const data = await fifaRes.json();
    const results: FifastandingResult[] = data.Results || [];

    if (results.length === 0) {
      return NextResponse.json({ success: true, message: 'No standings data returned from FIFA API.' });
    }

    // 3. Map FIFA API fields to our database table fields
    const mappedStandings = results.map((item) => {
      const groupName = item.Group?.[0]?.Description || 'Unknown Group';
      const teamName = item.Team?.ShortClubName || item.Team?.Name?.[0]?.Description || item.Team?.Abbreviation || 'Unknown Team';
      const teamCode = item.Team?.Abbreviation;

      return {
        group_name: groupName,
        team_name: teamName,
        team_code: teamCode,
        played: item.Played || 0,
        won: item.Won || 0,
        drawn: item.Drawn || 0,
        lost: item.Lost || 0,
        goals_for: item.For || 0,
        goals_against: item.Against || 0,
        goal_difference: item.GoalsDiference || 0,
        points: item.Points || 0,
        position: item.Position || 0,
        updated_at: new Date().toISOString(),
      };
    }).filter(item => item.team_code); // Filter out items missing team codes

    // 4. Initialize Supabase Admin Client
    const supabaseAdmin = createAdminClient();

    // 5. Upsert standings into database (using team_code as unique constraint)
    const { error } = await supabaseAdmin
      .from('group_standings')
      .upsert(mappedStandings, { onConflict: 'team_code' });

    if (error) {
      throw error;
    }

    console.log(`Successfully updated standings for ${mappedStandings.length} teams.`);
    return NextResponse.json({
      success: true,
      message: `Successfully updated standings for ${mappedStandings.length} teams.`,
      updatedCount: mappedStandings.length,
    });

  } catch (err: unknown) {
    console.error('Standings cron error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
