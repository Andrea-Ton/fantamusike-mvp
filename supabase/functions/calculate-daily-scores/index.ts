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
        let query = supabase.from(table).select(select);
        if (filterBuilder) {
            query = filterBuilder(query);
        }

        const { data, error } = await query.range(from, from + step - 1);
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
            .select('week_number, created_at')
            .gte('created_at', season.start_date) // Filter by season
            .order('week_number', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (snapshotError || !latestSnapshot) {
            return new Response(JSON.stringify({ message: 'No snapshots found. Scoring cannot proceed.' }), { status: 200 })
        }

        const weekNumber = latestSnapshot.week_number;

        console.log(`Calculating Daily Scores for Week ${weekNumber}...`)

        // 3. Fetch snapshots for the week (with pagination) - filtered by season
        const snapshots = await fetchAll(supabaseClient, 'weekly_snapshots', '*', (q: any) =>
            q.eq('week_number', weekNumber).gte('created_at', season.start_date)
        );
        console.log(`Fetched ${snapshots.length} snapshots for Week ${weekNumber}`);

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
            // Group bets by week to handle transitions correctly
            const betsByWeek = new Map<number, any[]>();
            pendingBets.forEach((p: any) => {
                const w = Number(p.bet_snapshot.week_number || weekNumber);
                if (!betsByWeek.has(w)) betsByWeek.set(w, []);
                betsByWeek.get(w)!.push(p);
            });

            for (const [w, bets] of betsByWeek) {
                console.log(`Resolving ${bets.length} bets for Week ${w}...`);

                const artistIdsForWeek = new Set<string>();
                bets.forEach((p: any) => {
                    if (p.artist_id) artistIdsForWeek.add(p.artist_id);
                    if (p.bet_snapshot?.rival?.id) artistIdsForWeek.add(p.bet_snapshot.rival.id);
                });

                const { data: scoresForWeek } = await supabaseClient
                    .from('weekly_scores')
                    .select('artist_id, total_points')
                    .eq('week_number', w);

                const weekScoreMap = new Map<string, number>();
                scoresForWeek?.forEach((s: any) => weekScoreMap.set(s.artist_id, s.total_points));

                for (const promo of bets) {
                    try {
                        const myId = promo.artist_id;
                        const rivalId = promo.bet_snapshot.rival.id;
                        const startMy = promo.bet_snapshot.initial_scores?.my || 0;
                        const startRival = promo.bet_snapshot.initial_scores?.rival || 0;

                        const currMy = weekScoreMap.get(myId) || 0;
                        const currRival = weekScoreMap.get(rivalId) || 0;

                        const myDelta = currMy - startMy;
                        const rivalDelta = currRival - startRival;

                        const wager = promo.bet_snapshot.wager; // 'my_artist' | 'rival' | 'draw'
                        let outcome = 'lost';
                        if (myDelta > rivalDelta) outcome = 'my_artist';
                        else if (rivalDelta > myDelta) outcome = 'rival';
                        else outcome = 'draw';

                        let status = 'lost';
                        if (wager === outcome) {
                            status = 'won';
                        } else if (outcome === 'draw') {
                            status = 'draw'; // Refund case
                        }

                        const isWin = status === 'won';

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
        }

        // 5. Calculate User Totals for the CURRENT WEEK ONLY
        console.log("Processing user points for week " + weekNumber + "...");

        // Use the snapshot timestamp as the "week start" for log reconciliation
        const weekStartDate = latestSnapshot.created_at;

        // Fetch all profiles and the LATEST team for each user up to the current week
        const profiles = await fetchAll(supabaseClient, 'profiles', 'id, total_score');

        // To handle carry-over effectively with pagination, we fetch all teams <= current week
        // and then reduce them to the latest one per user.
        // NOTE: In a very large DB, this should be optimized with a specialized RPC or window function.
        const allTeamsUpToNow = await fetchAll(supabaseClient, 'teams', '*', (q: any) =>
            q.lte('week_number', weekNumber).eq('season_id', season.id).order('week_number', { ascending: false })
        );

        const teamsByUser: Record<string, any> = {};
        (allTeamsUpToNow as any[])?.forEach((t: any) => {
            // Since we ordered by week_number DESC, the first one we see for each user is the latest
            if (!teamsByUser[t.user_id]) {
                teamsByUser[t.user_id] = t;
            }
        });

        // Fetch all weekly scores for current week - filtered by season
        const currentWeeklyScores = await fetchAll(supabaseClient, 'weekly_scores', 'artist_id, total_points', (q: any) =>
            q.eq('week_number', weekNumber).gte('created_at', season.start_date)
        );
        const scoresMap: Record<string, number> = {};
        (currentWeeklyScores as any[])?.forEach((s) => scoresMap[s.artist_id] = s.total_points);

        // Fetch Featured Artists
        const featuredArtists = await fetchAll(supabaseClient, 'featured_artists', 'spotify_id');
        const featuredIds = new Set((featuredArtists as any[])?.map((f: any) => f.spotify_id) || []);

        // Fetch ALL daily logs for this week to reconcile
        const weekLogs = await fetchAll(supabaseClient, 'daily_score_logs', 'user_id, points_gained', (q: any) => q.gte('created_at', weekStartDate));
        const logsSumByUser: Record<string, number> = {};
        (weekLogs as any[])?.forEach((l) => {
            logsSumByUser[l.user_id] = (logsSumByUser[l.user_id] || 0) + l.points_gained;
        });

        const dailyLogsToInsert: any[] = [];
        const profileUpdates: any[] = [];
        const today = new Date().toISOString().split('T')[0];

        for (const profile of (profiles as any[]) || []) {
            const team = teamsByUser[profile.id];
            if (!team) continue;

            const slots = [team.slot_1_id, team.slot_2_id, team.slot_3_id, team.slot_4_id, team.slot_5_id];
            let currentWeekCalculatedTotal = 0;

            for (const artistId of slots) {
                if (!artistId) continue;
                let points = scoresMap[artistId] || 0;

                // Apply Captain Multipliers
                if (team.captain_id === artistId) {
                    points = Math.round(points * (featuredIds.has(artistId) ? 2 : 1.5));
                }
                currentWeekCalculatedTotal += points;
            }

            // Delta = What the user should have earned THIS WEEK - What we already logged THIS WEEK
            const pointsAlreadyLoggedThisWeek = logsSumByUser[profile.id] || 0;
            const delta = currentWeekCalculatedTotal - pointsAlreadyLoggedThisWeek;

            if (delta > 0) {
                dailyLogsToInsert.push({
                    user_id: profile.id,
                    points_gained: delta,
                    date: today,
                    seen_by_user: false
                });

                profileUpdates.push({
                    id: profile.id,
                    total_score: (profile.total_score || 0) + delta,
                    updated_at: new Date().toISOString()
                });
            }
        }

        // 6. Bulk Update with Safety
        if (dailyLogsToInsert.length > 0) {
            console.log(`Accrediting ${dailyLogsToInsert.length} user point updates...`);
            const BATCH_SIZE = 500;
            for (let i = 0; i < dailyLogsToInsert.length; i += BATCH_SIZE) {
                const logsBatch = dailyLogsToInsert.slice(i, i + BATCH_SIZE);
                const profilesBatch = profileUpdates.slice(i, i + BATCH_SIZE);

                await Promise.all([
                    supabaseClient.from('daily_score_logs').insert(logsBatch),
                    supabaseClient.from('profiles').upsert(profilesBatch, { onConflict: 'id' })
                ]);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Scoring complete. Updated ${dailyLogsToInsert.length} users.`
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error('Scoring Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
