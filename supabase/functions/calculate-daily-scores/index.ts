import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for Deno environment
interface ArtistSnapshot {
    artist_id: string;
    popularity: number;
    followers: number;
    created_at: string;
}

interface WeeklyScore {
    week_number: number;
    artist_id: string;
    total_points: number;
}

// In Supabase Edge Functions (Deno), we use Deno.env.get()
const SPOTIFY_CLIENT_ID = Deno.env.get('NEXT_PUBLIC_SPOTIFY_CLIENT_ID')
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET')

async function getSpotifyToken() {
    const auth = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
    const resp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    })
    if (!resp.ok) throw new Error('Failed to get Spotify token')
    const data = await resp.json()
    return data.access_token
}

/**
 * Helper to fetch all records from a table using pagination to bypass Supabase 1000 limit
 */
async function fetchAll(supabase: any, table: string, select = '*', filterBuilder?: (query: any) => any) {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        let query = supabase.from(table).select(select).range(from, from + step - 1);
        if (filterBuilder) {
            query = filterBuilder(query);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allData = [...allData, ...data];
            from += step;
            if (data.length < step) hasMore = false;
        }
    }
    return allData;
}

// Deno.serve is the standard way to handle requests in Supabase Edge Functions
Deno.serve(async (_req: Request) => {
    // We must use the Edge-specific client initialization
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        // 1. Fetch Current Season
        const { data: season, error: seasonError } = await supabaseClient
            .from('seasons')
            .select('*')
            .eq('is_active', true)
            .single()

        if (seasonError || !season) {
            return new Response(JSON.stringify({ message: 'No active season found. Skipping scoring.' }), { status: 200 })
        }

        // 2. Determine Week Number from available snapshots
        // We use the latest week_number present in weekly_snapshots to ensure we score 
        // for the week that has a baseline, avoiding misalignment on Monday mornings.
        const { data: latestSnapshot, error: snapshotError } = await supabaseClient
            .from('weekly_snapshots')
            .select('week_number')
            .order('week_number', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (snapshotError || !latestSnapshot) {
            return new Response(JSON.stringify({ message: 'No snapshots found. Scoring cannot proceed.' }), { status: 200 })
        }

        const weekNumber = latestSnapshot.week_number;

        console.log(`Calculating Daily Scores for Week ${weekNumber}...`)

        // 3. Fetch snapshots for the week (with pagination)
        const snapshots = await fetchAll(supabaseClient, 'weekly_snapshots', '*', (q: any) => q.eq('week_number', weekNumber));

        if (!snapshots || snapshots.length === 0) {
            return new Response(JSON.stringify({ message: 'No snapshots found for current week. Skipping scoring.' }), { status: 200 })
        }

        const spotifyToken = await getSpotifyToken()

        // 4. Update Artist Scores
        for (const snapshot of snapshots as ArtistSnapshot[]) {
            console.log(`Processing artist: ${snapshot.artist_id}`);
            try {
                // Fetch fresh data from Spotify
                const artistResp = await fetch(`https://api.spotify.com/v1/artists/${snapshot.artist_id}`, {
                    headers: { Authorization: `Bearer ${spotifyToken}` }
                })
                if (!artistResp.ok) continue

                const artistData = await artistResp.json()
                const currentPop = artistData.popularity
                const currentFollowers = artistData.followers.total

                // Calculate Scores
                const popDelta = currentPop - snapshot.popularity
                const hypeScore = popDelta * 10
                const startFollowers = snapshot.followers > 0 ? snapshot.followers : 1
                const growthPercent = ((currentFollowers - snapshot.followers) / startFollowers) * 100
                const finalFanbaseScore = Math.round(growthPercent)

                // Releases
                const releasesResp = await fetch(`https://api.spotify.com/v1/artists/${snapshot.artist_id}/albums?include_groups=album,single,appears_on&limit=50&market=IT`, {
                    headers: { Authorization: `Bearer ${spotifyToken}` }
                })
                const releasesData = await releasesResp.json()
                const releases = releasesData.items || []

                let releaseBonus = 0
                const weekStart = new Date(snapshot.created_at)
                for (const release of releases) {
                    const releaseDate = new Date(release.release_date)
                    if (releaseDate >= weekStart && release.album_type !== 'compilation') {
                        if (release.album_type === 'single') releaseBonus += 20
                        else if (release.album_type === 'album') releaseBonus += 50
                    }
                }

                const totalPoints = hypeScore + finalFanbaseScore + releaseBonus

                // Update Cache & Weekly Scores
                await supabaseClient.from('artists_cache').update({
                    current_popularity: currentPop,
                    current_followers: currentFollowers,
                    last_updated: new Date().toISOString()
                }).eq('spotify_id', snapshot.artist_id)

                await supabaseClient.from('weekly_scores').upsert({
                    week_number: weekNumber,
                    artist_id: snapshot.artist_id,
                    popularity_gain: popDelta,
                    follower_gain_percent: growthPercent,
                    release_bonus: releaseBonus,
                    total_points: totalPoints
                }, { onConflict: 'week_number, artist_id' })

            } catch (err) {
                console.error(`Error processing artist ${snapshot.artist_id}:`, err)
            }
        }

        // 4b. Resolve MusiBets
        console.log("Resolving MusiBets...");
        const { data: pendingBets } = await supabaseClient
            .from('daily_promos')
            .select('*')
            .eq('bet_done', true)
            .eq('bet_resolved', false);

        if (pendingBets && pendingBets.length > 0) {
            // Fetch latest scores for all involved artists efficiently
            const artistIds = new Set<string>();
            pendingBets.forEach((p: any) => {
                if (p.artist_id) artistIds.add(p.artist_id);
                if (p.bet_snapshot?.rival?.id) artistIds.add(p.bet_snapshot.rival.id);
            });

            const { data: latestScores } = await supabaseClient
                .from('weekly_scores')
                .select('artist_id, total_points')
                .eq('week_number', weekNumber)
                .in('artist_id', Array.from(artistIds));

            const scoreMap = new Map<string, number>();
            latestScores?.forEach((s: any) => scoreMap.set(s.artist_id, s.total_points));

            for (const promo of pendingBets) {
                try {
                    const myId = promo.artist_id;
                    const rivalId = promo.bet_snapshot.rival.id;
                    const startMy = promo.bet_snapshot.initial_scores?.my || 0;
                    const startRival = promo.bet_snapshot.initial_scores?.rival || 0;

                    const currMy = scoreMap.get(myId) || 0;
                    const currRival = scoreMap.get(rivalId) || 0;

                    const myDelta = currMy - startMy;
                    const rivalDelta = currRival - startRival;

                    const wager = promo.bet_snapshot.wager; // 'my_artist' | 'rival'
                    let status = 'lost';

                    if (myDelta === rivalDelta) {
                        status = 'draw';
                    } else if (wager === 'my_artist' && myDelta > rivalDelta) {
                        status = 'won';
                    } else if (wager === 'rival' && rivalDelta > myDelta) {
                        status = 'won';
                    }

                    const isWin = status === 'won';
                    const isDraw = status === 'draw';

                    // Rewards
                    const POINTS_REWARD = 10;
                    const COINS_REWARD = 0;
                    const pointsAwarded = isWin ? POINTS_REWARD : 0;
                    const coinsAwarded = isWin ? COINS_REWARD : 0;

                    // Update Snapshot
                    const newSnapshot = {
                        ...promo.bet_snapshot,
                        status: status,
                        scores: { my: myDelta, rival: rivalDelta },
                        won_points: pointsAwarded,
                        won_coins: coinsAwarded
                    };

                    // Update Promo
                    await supabaseClient
                        .from('daily_promos')
                        .update({
                            bet_snapshot: newSnapshot,
                            bet_resolved: true,
                            total_points: (promo.total_points || 0) + pointsAwarded,
                            total_coins: (promo.total_coins || 0) + coinsAwarded
                        })
                        .eq('id', promo.id);

                    // Award to Profile immediately
                    if (isWin) {
                        const { data: prof } = await supabaseClient.from('profiles').select('listen_score, musi_coins').eq('id', promo.user_id).single();
                        if (prof) {
                            await supabaseClient
                                .from('profiles')
                                .update({
                                    listen_score: (prof.listen_score || 0) + pointsAwarded,
                                    musi_coins: (prof.musi_coins || 0) + coinsAwarded
                                })
                                .eq('id', promo.user_id);
                        }
                    }

                } catch (e) {
                    console.error("Error resolving bet for promo " + promo.id, e);
                }
            }
        }

        // 5. Recalculate User Totals (Batch approach with pagination)
        const allWeeklyScores = await fetchAll(supabaseClient, 'weekly_scores', 'week_number, artist_id, total_points', (q: any) => q.lte('week_number', weekNumber));

        const scoresMap: Record<number, Record<string, number>> = {};
        (allWeeklyScores as WeeklyScore[])?.forEach((s) => {
            if (!scoresMap[s.week_number]) scoresMap[s.week_number] = {};
            scoresMap[s.week_number][s.artist_id] = s.total_points;
        });

        const featuredArtists = await fetchAll(supabaseClient, 'featured_artists', 'spotify_id');
        const featuredIds = new Set((featuredArtists as any[])?.map((f: any) => f.spotify_id) || []);

        const profiles = await fetchAll(supabaseClient, 'profiles', 'id, total_score');
        const allTeams = await fetchAll(supabaseClient, 'teams', '*', (q: any) => q.lte('week_number', weekNumber).order('week_number', { ascending: true }));

        const teamsByUser: Record<string, any[]> = {};
        (allTeams as any[])?.forEach((t: any) => {
            if (!teamsByUser[t.user_id]) teamsByUser[t.user_id] = [];
            teamsByUser[t.user_id].push(t);
        });

        const dailyLogs: any[] = []
        const profileUpdates: any[] = []
        const today = new Date().toISOString().split('T')[0]

        for (const profile of (profiles as any[]) || []) {
            const userTeams = teamsByUser[profile.id] || [];
            let newTotal = 0;

            for (let w = 1; w <= weekNumber; w++) {
                let activeTeam = null;
                for (const team of userTeams) {
                    if (team.week_number <= w) activeTeam = team;
                    else break;
                }

                if (activeTeam) {
                    const slots = [activeTeam.slot_1_id, activeTeam.slot_2_id, activeTeam.slot_3_id, activeTeam.slot_4_id, activeTeam.slot_5_id];
                    const weekScores = scoresMap[w] || {};

                    for (const artistId of slots) {
                        if (!artistId) continue;
                        let points = weekScores[artistId] || 0;
                        if (activeTeam.captain_id === artistId) {
                            points = Math.round(points * (featuredIds.has(artistId) ? 2 : 1.5));
                        }
                        newTotal += points;
                    }
                }
            }

            const delta = newTotal - profile.total_score;
            if (delta > 0) {
                dailyLogs.push({
                    user_id: profile.id,
                    points_gained: delta,
                    date: today,
                    seen_by_user: false
                })
                profileUpdates.push({
                    id: profile.id,
                    total_score: newTotal,
                    updated_at: new Date().toISOString()
                })
            }
        }

        // 6. Bulk Upsert
        if (dailyLogs.length > 0) {
            console.log(`Updating ${dailyLogs.length} user profiles...`)
            const BATCH_SIZE = 500;
            for (let i = 0; i < dailyLogs.length; i += BATCH_SIZE) {
                const logsBatch = dailyLogs.slice(i, i + BATCH_SIZE);
                const profilesBatch = profileUpdates.slice(i, i + BATCH_SIZE);
                await Promise.all([
                    supabaseClient.from('daily_score_logs').insert(logsBatch),
                    supabaseClient.from('profiles').upsert(profilesBatch)
                ])
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Scoring complete. Updated ${dailyLogs.length} users.`
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error('Scoring Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
