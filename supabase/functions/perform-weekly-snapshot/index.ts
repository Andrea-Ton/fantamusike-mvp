import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ArtistCache {
  spotify_id: string;
  current_popularity: number;
  current_followers: number;
}

Deno.serve(async (_req: Request) => {
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
      .maybeSingle()

    if (seasonError || !season) {
      return new Response(JSON.stringify({ message: 'No active season found. Skipping snapshot.' }), { status: 200 })
    }

    // 2. Fetch Latest Week and calculate next one (Incremental Logic)
    const { data: latestSnap, error: lastWeekError } = await supabaseClient
      .from('weekly_snapshots')
      .select('week_number')
      .order('week_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastWeekError) throw lastWeekError;

    // Se non ci sono snapshot, partiamo dalla settimana 1
    const weekNumber = latestSnap ? Number(latestSnap.week_number) + 1 : 1;

    console.log(`Performing weekly snapshot for Week ${weekNumber}...`)

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

    // 3. Fetch all cached artists (with pagination)
    const artists = await fetchAll(supabaseClient, 'artists_cache');

    if (!artists || artists.length === 0) {
      return new Response(JSON.stringify({ message: 'No artists found in cache. Skipping snapshot.' }), { status: 200 })
    }

    // 4. Fetch existing snapshots for THIS week only to prevent duplicates (with pagination) - filtered by season
    const existingSnapshots = await fetchAll(supabaseClient, 'weekly_snapshots', 'artist_id', (q: any) =>
      q.eq('week_number', weekNumber).gte('created_at', season.start_date)
    );
    const existingIds = new Set(existingSnapshots.map((s: any) => s.artist_id));

    // 5. Create Snapshots for MISSING artists only
    const snapshots = (artists as ArtistCache[])
      .filter(artist => !existingIds.has(artist.spotify_id))
      .map(artist => ({
        week_number: weekNumber,
        artist_id: artist.spotify_id,
        popularity: artist.current_popularity,
        followers: artist.current_followers
      }))

    if (snapshots.length === 0) {
      return new Response(JSON.stringify({ message: `No new artists to snapshot for Week ${weekNumber}.` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 6. Bulk Insert snapshots (handling potential large sets)
    const BATCH_SIZE = 500;
    for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
      const batch = snapshots.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabaseClient
        .from('weekly_snapshots')
        .insert(batch);

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Snapshot created for Week ${weekNumber} (${snapshots.length} new artists)`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Snapshot Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
