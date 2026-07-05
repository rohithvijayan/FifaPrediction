import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface FifaActor {
  number: number;
  name: { eng: string };
  tags: Array<{ name: string; value: string }>;
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

    // 2. Fetch FIFA Authentication Token
    console.log('Fetching FIFA Token...');
    const tokenRes = await fetch('https://cxm-api.fifa.com/fifaplusweb/api/external/gameDay/token', {
      next: { revalidate: 0 }
    });

    if (!tokenRes.ok) {
      throw new Error(`Failed to fetch FIFA token: ${tokenRes.statusText}`);
    }

    const tokenData = await tokenRes.json();
    const token = tokenData.token;

    // 3. Fetch Top Scorers Statistics from FIFA API
    const query = `(and resourceStatus==\`urn:gd:resourceStatus:active\` _externalId~\`urn:gd:story:classification:gcp_top_scorer:competitionId:285023:goals:rank_asc:page:1$\`)`;
    const fifaUrl = `https://gameday-prod.fifa.mangodev.co.uk/1-0/stories?query=${encodeURIComponent(query)}&skip=0&limit=1&sort=tags.name==urn:gd:tag:story:fifa:column_number:asc`;

    console.log('Fetching Golden Boot statistics from:', fifaUrl);
    const statsRes = await fetch(fifaUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });

    if (!statsRes.ok) {
      throw new Error(`Failed to fetch Golden Boot stats: ${statsRes.statusText}`);
    }

    const statsData = await statsRes.json();
    const items = statsData.items || [];
    if (items.length === 0) {
      return NextResponse.json({ success: true, message: 'No Golden Boot data returned from FIFA API.' });
    }

    const actors: FifaActor[] = items[0].actors || [];

    // Map top 5 players
    const mappedPlayers = actors.slice(0, 5).map((actor) => {
      const getTagValue = (tagName: string) => {
        const tag = actor.tags.find(t => t.name === tagName);
        return tag ? tag.value : '';
      };

      return {
        rank: actor.number,
        player_name: actor.name?.eng || 'Unknown Player',
        team_code: getTagValue('urn:gd:tag:story:team:abbreviation') || 'UNK',
        goals: parseInt(getTagValue('urn:gd:tag:football:stats:goals') || '0', 10),
        assists: parseInt(getTagValue('urn:gd:tag:football:stats:assists') || '0', 10),
        minutes_played: parseInt(getTagValue('urn:gd:tag:football:stats:total_competition_minutes_played') || '0', 10),
        position: getTagValue('urn:gd:tag:story:staff:position') || 'N/A',
        updated_at: new Date().toISOString(),
      };
    });

    // 4. Initialize Supabase Admin Client
    const supabaseAdmin = createAdminClient();

    // 5. Try to upsert into public.golden_boot_standings table (using player_name as unique constraint)
    const { error: dbError } = await supabaseAdmin
      .from('golden_boot_standings')
      .upsert(mappedPlayers, { onConflict: 'player_name' });

    if (dbError) {
      console.warn('Could not save to DB (table might not exist yet):', dbError.message);
      return NextResponse.json({
        success: true,
        message: 'Fetched Golden Boot data successfully, but did not save to DB because table might not exist.',
        data: mappedPlayers
      });
    }

    console.log(`Successfully updated Golden Boot standings for ${mappedPlayers.length} players.`);
    return NextResponse.json({
      success: true,
      message: `Successfully updated Golden Boot standings for ${mappedPlayers.length} players in DB.`,
      data: mappedPlayers
    });

  } catch (err: unknown) {
    console.error('Golden Boot cron error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
