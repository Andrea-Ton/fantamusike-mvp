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
      .single()

    if (seasonError || !season) {
      return new Response(JSON.stringify({ message: 'No active season found. Skipping snapshot.' }), { status: 200 })
    }

    // 2. Calculate Week Number
    const start = new Date(season.start_date)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    const weekNumber = Math.max(1, Math.ceil(diff / oneWeek))

    console.log(`Performing weekly snapshot for Week ${weekNumber}...`)

    // 3. Fetch all cached artists
    const { data: artists, error: fetchError } = await supabaseClient
      .from('artists_cache')
      .select('*')

    if (fetchError || !artists) {
      throw new Error(`Failed to fetch artists: ${fetchError?.message}`)
    }

    // 4. Check for existing snapshots (Prevent Duplicates)
    const { data: existingSnapshots } = await supabaseClient
      .from('weekly_snapshots')
      .select('artist_id')
      .eq('week_number', weekNumber)

    const existingIds = new Set((existingSnapshots as { artist_id: string }[])?.map((s) => s.artist_id) || [])

    // 5. Create Snapshots for NEW artists only
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

    const { error: insertError } = await supabaseClient
      .from('weekly_snapshots')
      .insert(snapshots)

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Snapshot created for Week ${weekNumber} (${snapshots.length} artists)`
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
