import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Helper to fetch all records from a table using pagination
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

Deno.serve(async (_req: Request) => {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        console.log("Starting Weekly Leaderboard Processing...");

        // 1. Fetch Current Standing
        const players = await fetchAll(supabaseClient, 'profiles', 'id, total_score, listen_score, musi_coins, created_at', (q: any) =>
            q.or('total_score.gt.0,listen_score.gt.0')
        );

        // Calculate combined score and sort manually to be 100% sure with tie-breaking
        const sortedPlayers = players
            .map(p => ({ ...p, combined_score: (p.total_score || 0) + (p.listen_score || 0) }))
            .filter(p => p.combined_score > 0)
            .sort((a, b) =>
                b.combined_score - a.combined_score ||
                b.total_score - a.total_score ||
                b.listen_score - a.listen_score ||
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

        console.log(`Processing ${sortedPlayers.length} active players...`);

        if (sortedPlayers.length === 0) {
            return new Response(JSON.stringify({ message: 'No active players found. Skipping.' }), { status: 200 });
        }

        // 2. Determine Week Number
        // We look at the latest snapshot to find the week we just finished
        const { data: latestSnap } = await supabaseClient
            .from('weekly_snapshots')
            .select('week_number')
            .order('week_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        const weekNumber = Number(latestSnap?.week_number || 1);

        // 4. Calculate Rewards & Prepare Batch Data (REWARDS REMOVED)
        // Historically, this gave MusiCoins. Now it only records the rank and score.
        const finishedWeek = weekNumber;
        const historyEntries: any[] = [];

        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;

            historyEntries.push({
                user_id: player.id,
                week_number: finishedWeek,
                rank: rank,
                score: player.combined_score,
                reward_musicoins: 0, // No rewards
                is_seen: false
            });
        });

        // 5. Execute Updates in Batches
        const BATCH_SIZE = 500;

        // Save History
        for (let i = 0; i < historyEntries.length; i += BATCH_SIZE) {
            const batch = historyEntries.slice(i, i + BATCH_SIZE);
            await supabaseClient.from('weekly_leaderboard_history').insert(batch);
        }

        // 6. RESET SCORES FOR ALL PLAYERS
        console.log("Resetting total_score and listen_score for all players...");
        const { error: resetError } = await supabaseClient
            .from('profiles')
            .update({ total_score: 0, listen_score: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Valid users only

        if (resetError) throw resetError;

        return new Response(JSON.stringify({
            success: true,
            message: `Weekly leaderboard processed for Week ${weekNumber}. History recorded for ${historyEntries.length} players.`
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Weekly Processor Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
