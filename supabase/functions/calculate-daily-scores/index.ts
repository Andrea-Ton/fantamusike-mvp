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

async function fetchWithRetry(url: string, options: any, retries = 3, backoff = 1000) {
    const MAX_WAIT_MS = 60000; // Cap wait time at 60 seconds

    for (let i = 0; i < retries; i++) {
        try {
            const resp = await fetch(url, options);
            if (resp.ok) return resp;
            if (resp.status === 429) {
                const retryAfter = resp.headers.get('Retry-After');
                let wait = backoff * Math.pow(2, i);

                if (retryAfter) {
                    const parsed = parseInt(retryAfter);
                    if (!isNaN(parsed)) {
                        // Spotify uses seconds. If it looks like a timestamp/very large number, 
                        // it might be a date or we just hit a severe limit.
                        wait = parsed * 1000;
                    } else {
                        // Might be an HTTP-date
                        const retryDate = new Date(retryAfter).getTime();
                        if (!isNaN(retryDate)) {
                            wait = Math.max(0, retryDate - Date.now());
                        }
                    }
                }

                if (wait > MAX_WAIT_MS) {
                    console.error(`Rate limit wait time too long (${wait}ms). Aborting request for ${url}`);
                    return resp; // Return the 429 so the caller knows it failed
                }

                console.warn(`Rate limited (429) for ${url}. Waiting ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            if (resp.status >= 500) {
                const wait = Math.min(MAX_WAIT_MS, backoff * Math.pow(2, i));
                console.warn(`Server error ${resp.status}. Retrying in ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            const errorBody = await resp.text();
            console.error(`Spotify API Error ${resp.status} for ${url}: ${errorBody}`);
            return resp;
        } catch (err) {
            if (i === retries - 1) throw err;
            const wait = Math.min(MAX_WAIT_MS, backoff * Math.pow(2, i));
            await new Promise(r => setTimeout(r, wait));
        }
    }
    throw new Error(`Failed after ${retries} retries`);
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
        const startTime = Date.now();
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
        const { data: latestSnapshot, error: snapshotError } = await supabaseClient
            .from('weekly_snapshots')
            .select('week_number, created_at')
            .gte('created_at', season.start_date)
            .order('week_number', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (snapshotError || !latestSnapshot) {
            return new Response(JSON.stringify({ message: 'No snapshots found. Scoring cannot proceed.' }), { status: 200 })
        }

        const weekNumber = latestSnapshot.week_number;
        const weekStartDate = latestSnapshot.created_at;

        console.log(`Calculating Daily Scores for Week ${weekNumber}...`)

        // 3. Identification of Active Artists (Optimization)
        // Correct logic: take the latest team for EACH user where week_number <= current
        const allTeamsUpToNow = await fetchAll(supabaseClient, 'teams', 'user_id, week_number, slot_1_id, slot_2_id, slot_3_id, slot_4_id, slot_5_id, captain_id', (q: any) =>
            q.lte('week_number', weekNumber).eq('season_id', season.id).order('week_number', { ascending: false })
        );

        const activeTeamsByUser: Record<string, any> = {};
        allTeamsUpToNow.forEach((t: any) => {
            if (!activeTeamsByUser[t.user_id]) activeTeamsByUser[t.user_id] = t;
        });

        const activeArtistIds = new Set<string>();
        Object.values(activeTeamsByUser).forEach((t: any) => {
            [t.slot_1_id, t.slot_2_id, t.slot_3_id, t.slot_4_id, t.slot_5_id].forEach(id => { if (id) activeArtistIds.add(id); });
        });

        const featuredArtists = await fetchAll(supabaseClient, 'featured_artists', 'spotify_id');
        const featuredIds = new Set((featuredArtists as any[])?.map((f: any) => f.spotify_id) || []);
        featuredIds.forEach(id => activeArtistIds.add(id));

        const { data: activeBets } = await supabaseClient.from('daily_promos').select('id, user_id, artist_id, total_points, total_coins, bet_snapshot').eq('bet_done', true).eq('bet_resolved', false);
        activeBets?.forEach((b: any) => {
            if (b.artist_id) activeArtistIds.add(b.artist_id);
            if (b.bet_snapshot?.rival?.id) activeArtistIds.add(b.bet_snapshot.rival.id);
        });

        console.log(`Identified ${activeArtistIds.size} active artists needing updates.`);

        // 3b. Fetch snapshots only for active artists
        const snapshots = await fetchAll(supabaseClient, 'weekly_snapshots', '*', (q: any) =>
            q.eq('week_number', weekNumber).in('artist_id', Array.from(activeArtistIds))
        );
        console.log(`Fetched ${snapshots.length} active snapshots for Week ${weekNumber}`);

        const spotifyToken = await getSpotifyToken()

        // 4. Update Artist Scores - Optimized with Batching & Concurrency Limits
        const artistsCacheUpdates: any[] = [];
        const weeklyScoresUpdates: any[] = [];
        const scoresMap: Record<string, number> = {};

        const SPOTIFY_BATCH_SIZE = 50;
        const artistSnapshots = snapshots as ArtistSnapshot[];

        for (let i = 0; i < artistSnapshots.length; i += SPOTIFY_BATCH_SIZE) {
            const batch = artistSnapshots.slice(i, i + SPOTIFY_BATCH_SIZE);
            const ids = batch.map(a => a.artist_id).filter(id => !!id).join(',');

            if (!ids) continue;

            console.log(`Fetching Spotify data for batch starting at ${i} (${batch.length} artists)`);
            const artistResp = await fetchWithRetry(`https://api.spotify.com/v1/artists?ids=${ids}`, {
                headers: { Authorization: `Bearer ${spotifyToken}` }
            });

            if (!artistResp.ok) {
                console.error(`Skipping batch starting at ${i} due to Spotify API error ${artistResp.status}`);
                continue;
            }

            const artistData = await artistResp.json();
            const spotifyArtists = artistData.artists || [];

            const CONCURRENCY_LIMIT = 5; // Conservative concurrency for releases
            for (let j = 0; j < batch.length; j += CONCURRENCY_LIMIT) {
                const subBatch = batch.slice(j, j + CONCURRENCY_LIMIT);
                await Promise.all(subBatch.map(async (snapshot) => {
                    const spotifyArtist = spotifyArtists.find((a: any) => a?.id === snapshot.artist_id);
                    if (!spotifyArtist) return;

                    const currentPop = spotifyArtist.popularity;
                    const currentFollowers = spotifyArtist.followers.total;

                    const popDelta = currentPop - snapshot.popularity;
                    const startFollowers = snapshot.followers > 0 ? snapshot.followers : 1;
                    const growthPercent = ((currentFollowers - snapshot.followers) / startFollowers) * 100;

                    let releaseBonus = 0;
                    try {
                        const releasesResp = await fetchWithRetry(`https://api.spotify.com/v1/artists/${snapshot.artist_id}/albums?include_groups=album,single&limit=20&market=IT`, {
                            headers: { Authorization: `Bearer ${spotifyToken}` }
                        });
                        if (releasesResp.ok) {
                            const releasesData = await releasesResp.json();
                            const releases = releasesData.items || [];
                            const weekStart = new Date(snapshot.created_at);
                            for (const release of releases) {
                                const releaseDate = new Date(release.release_date);
                                if (releaseDate >= weekStart && release.album_type !== 'compilation') {
                                    if (release.album_type === 'single') releaseBonus += 20;
                                    else if (release.album_type === 'album') releaseBonus += 50;
                                }
                            }
                        }
                    } catch (e) {
                        console.error(`Error fetching releases for ${snapshot.artist_id}:`, e);
                    }

                    const totalPoints = (popDelta * 10) + Math.round(growthPercent) + releaseBonus;
                    scoresMap[snapshot.artist_id] = totalPoints;

                    artistsCacheUpdates.push({
                        spotify_id: snapshot.artist_id,
                        current_popularity: currentPop,
                        current_followers: currentFollowers,
                        last_updated: new Date().toISOString()
                    });

                    weeklyScoresUpdates.push({
                        week_number: weekNumber,
                        artist_id: snapshot.artist_id,
                        popularity_gain: popDelta,
                        follower_gain_percent: growthPercent,
                        release_bonus: releaseBonus,
                        total_points: totalPoints
                    });
                }));
            }
        }

        // Bulk update Database
        if (artistsCacheUpdates.length > 0) {
            console.log(`Bulk updating ${artistsCacheUpdates.length} artists...`);
            const DB_BATCH_SIZE = 100;
            for (let i = 0; i < artistsCacheUpdates.length; i += DB_BATCH_SIZE) {
                const cacheBatch = artistsCacheUpdates.slice(i, i + DB_BATCH_SIZE);
                const scoresBatch = weeklyScoresUpdates.slice(i, i + DB_BATCH_SIZE);
                await Promise.all([
                    supabaseClient.from('artists_cache').upsert(cacheBatch, { onConflict: 'spotify_id' }),
                    supabaseClient.from('weekly_scores').upsert(scoresBatch, { onConflict: 'week_number, artist_id' })
                ]);
            }
        }

        // 4b. Resolve MusiBets (Optimized for Bulk)
        console.log("Resolving MusiBets...");
        const promosUpdates: any[] = [];
        const userRewards: Record<string, { points: number, coins: number }> = {};

        if (activeBets && activeBets.length > 0) {
            const weekNumbers = [...new Set(activeBets.map((p: any) => Number(p.bet_snapshot.week_number || weekNumber)))];
            const { data: allScores } = await supabaseClient.from('weekly_scores').select('artist_id, total_points, week_number').in('week_number', weekNumbers);
            const scoreCache = new Map<string, number>();
            allScores?.forEach((s: any) => scoreCache.set(`${s.week_number}_${s.artist_id}`, s.total_points));

            for (const promo of activeBets) {
                const w = Number(promo.bet_snapshot.week_number || weekNumber);
                const myId = promo.artist_id;
                const rivalId = promo.bet_snapshot.rival?.id;
                if (!rivalId) continue;

                const currMy = scoreCache.get(`${w}_${myId}`) ?? (scoresMap[myId] || 0);
                const currRival = scoreCache.get(`${w}_${rivalId}`) ?? (scoresMap[rivalId] || 0);

                const startMy = promo.bet_snapshot.initial_scores?.my || 0;
                const startRival = promo.bet_snapshot.initial_scores?.rival || 0;

                const myDelta = currMy - startMy;
                const rivalDelta = currRival - startRival;

                const wager = promo.bet_snapshot.wager;
                let outcome = (myDelta > rivalDelta) ? 'my_artist' : (rivalDelta > myDelta ? 'rival' : 'draw');
                let status = (wager === outcome) ? 'won' : (outcome === 'draw' ? 'draw' : 'lost');

                const pointsAwarded = (status === 'won') ? 10 : 0;
                const coinsAwarded = (status === 'won') ? 0 : 0;

                promosUpdates.push({
                    id: promo.id,
                    user_id: promo.user_id,
                    artist_id: promo.artist_id,
                    bet_snapshot: { ...promo.bet_snapshot, status, scores: { my: myDelta, rival: rivalDelta }, won_points: pointsAwarded, won_coins: coinsAwarded },
                    bet_resolved: true,
                    total_points: (promo.total_points || 0) + pointsAwarded,
                    total_coins: (promo.total_coins || 0) + coinsAwarded
                });

                if (pointsAwarded > 0 || coinsAwarded > 0) {
                    if (!userRewards[promo.user_id]) userRewards[promo.user_id] = { points: 0, coins: 0 };
                    userRewards[promo.user_id].points += pointsAwarded;
                    userRewards[promo.user_id].coins += coinsAwarded;
                }
            }

            // Bulk update daily_promos
            if (promosUpdates.length > 0) {
                console.log(`Bulk updating ${promosUpdates.length} MusiBets...`);
                for (let i = 0; i < promosUpdates.length; i += 100) {
                    const { error: promoErr } = await supabaseClient.from('daily_promos').upsert(promosUpdates.slice(i, i + 100));
                    if (promoErr) console.error("Error bulk updating daily_promos:", promoErr);
                }
            }

            // Bulk update profiles (Listen Score & Coins)
            const userIds = Object.keys(userRewards);
            if (userIds.length > 0) {
                console.log(`Calculating rewards for ${userIds.length} users...`);
                const { data: targetProfiles } = await supabaseClient.from('profiles').select('id, listen_score, musi_coins').in('id', userIds);
                const rewardUpdates = (targetProfiles as any[])?.map(p => ({
                    id: p.id,
                    listen_score: (p.listen_score || 0) + (userRewards[p.id]?.points || 0),
                    musi_coins: (p.musi_coins || 0) + (userRewards[p.id]?.coins || 0),
                    updated_at: new Date().toISOString()
                })) || [];

                if (rewardUpdates.length > 0) {
                    for (let i = 0; i < rewardUpdates.length; i += 100) {
                        const { error: profErr } = await supabaseClient.from('profiles').upsert(rewardUpdates.slice(i, i + 100), { onConflict: 'id' });
                        if (profErr) console.error("Error bulk updating profile rewards:", profErr);
                    }
                }
            }
        }

        // 5. Calculate User Totals (Idempotent)
        console.log(`Processing user points for week ${weekNumber}...`);
        const { data: finalScores } = await supabaseClient.from('weekly_scores').select('artist_id, total_points').eq('week_number', weekNumber);
        const finalScoresMap: Record<string, number> = {};
        (finalScores as any[])?.forEach((s: any) => finalScoresMap[s.artist_id] = s.total_points);

        const profiles = await fetchAll(supabaseClient, 'profiles', 'id, total_score');
        const teamsByUser = activeTeamsByUser; // Simplified since we already built this map

        // Fetch logs for the WHOLE week to determine what has already been accredited
        const { data: weekLogs } = await supabaseClient.from('daily_score_logs').select('user_id, points_gained').gte('created_at', weekStartDate);
        const logsSumByUser: Record<string, number> = {};
        weekLogs?.forEach((l: any) => {
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
                let points = finalScoresMap[artistId] || 0;
                if (team.captain_id === artistId) {
                    points = Math.round(points * (featuredIds.has(artistId) ? 2 : 1.5));
                }
                currentWeekCalculatedTotal += points;
            }

            const pointsAlreadyLoggedThisWeek = logsSumByUser[profile.id] || 0;
            const delta = currentWeekCalculatedTotal - pointsAlreadyLoggedThisWeek;

            if (delta !== 0) {
                dailyLogsToInsert.push({ user_id: profile.id, points_gained: delta, date: today });
                profileUpdates.push({ id: profile.id, total_score: (profile.total_score || 0) + delta, updated_at: new Date().toISOString() });
            }
        }

        if (dailyLogsToInsert.length > 0) {
            console.log(`Updating ${dailyLogsToInsert.length} users with delta...`);
            for (let i = 0; i < dailyLogsToInsert.length; i += 100) {
                await Promise.all([
                    supabaseClient.from('daily_score_logs').insert(dailyLogsToInsert.slice(i, i + 100)),
                    supabaseClient.from('profiles').upsert(profileUpdates.slice(i, i + 100), { onConflict: 'id' })
                ]);
            }
        }

        const duration = (Date.now() - startTime) / 1000;
        console.log(`Scoring completed in ${duration}s`);

        return new Response(JSON.stringify({
            success: true,
            message: `Scoring complete. Updated ${dailyLogsToInsert.length} users in ${duration}s.`
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error('Scoring Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
