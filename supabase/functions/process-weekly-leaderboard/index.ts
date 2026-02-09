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
        // We order by (total_score + listen_score) DESC
        const players = await fetchAll(supabaseClient, 'profiles', 'id, total_score, listen_score, musi_coins', (q: any) =>
            q.or('total_score.gt.0,listen_score.gt.0')
        );

        // Calculate combined score and sort manually to be 100% sure
        const sortedPlayers = players
            .map(p => ({ ...p, combined_score: (p.total_score || 0) + (p.listen_score || 0) }))
            .filter(p => p.combined_score > 0)
            .sort((a, b) => b.combined_score - a.combined_score || b.listen_score - a.listen_score);

        console.log(`Processing ${sortedPlayers.length} active players...`);

        if (sortedPlayers.length === 0) {
            return new Response(JSON.stringify({ message: 'No active players found. Skipping.' }), { status: 200 });
        }

        // 2. Fetch Leaderboard Configuration
        const { data: configRows } = await supabaseClient.from('leaderboard_config').select('*');
        const configMap: Record<string, number> = {};
        configRows?.forEach((c: any) => configMap[c.tier] = c.reward_musicoins);

        // 3. Determine Week Number
        // We look at the latest snapshot to find the week we just finished
        const { data: latestSnap } = await supabaseClient
            .from('weekly_snapshots')
            .select('week_number')
            .order('week_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        const weekNumber = Number(latestSnap?.week_number || 1);

        // 4. Calculate Rewards & Prepare Batch Data
        // The results are for the week that JUST FINISHED
        const finishedWeek = weekNumber;
        const historyEntries: any[] = [];
        const profileUpdates: any[] = [];

        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            let reward = 0;

            // Tier Logic
            if (rank === 1) reward = configMap['rank_1'] || 0;
            else if (rank === 2) reward = configMap['rank_2'] || 0;
            else if (rank === 3) reward = configMap['rank_3'] || 0;
            else if (rank <= 10) reward = configMap['top_10'] || 0;
            else if (rank <= 20) reward = configMap['top_20'] || 0;
            else if (rank <= 50) reward = configMap['top_50'] || 0;
            else if (rank <= 100) reward = configMap['top_100'] || 0;

            historyEntries.push({
                user_id: player.id,
                week_number: finishedWeek,
                rank: rank,
                score: player.combined_score,
                reward_musicoins: reward,
                is_seen: false
            });

            if (reward > 0) {
                profileUpdates.push({
                    id: player.id,
                    musi_coins: (player.musi_coins || 0) + reward
                });
            }
        });

        // 5. Execute Updates in Batches
        const BATCH_SIZE = 500;

        // Save History
        for (let i = 0; i < historyEntries.length; i += BATCH_SIZE) {
            const batch = historyEntries.slice(i, i + BATCH_SIZE);
            await supabaseClient.from('weekly_leaderboard_history').insert(batch);
        }

        // Credit Rewards
        for (let i = 0; i < profileUpdates.length; i += BATCH_SIZE) {
            const batch = profileUpdates.slice(i, i + BATCH_SIZE);
            await supabaseClient.from('profiles').upsert(batch, { onConflict: 'id' });
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
            message: `Weekly leaderboard processed for Week ${weekNumber}. Rewards assigned to ${profileUpdates.length} players.`
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Weekly Processor Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
