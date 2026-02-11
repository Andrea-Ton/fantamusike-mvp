'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ArtistCategory, QUIZ_CONFIG } from '@/config/promo';
import { ARTIST_TIERS } from '@/config/game';
import { generateQuiz } from '@/lib/quiz-generator';
import { getArtist, getArtistReleases, getArtistTopTracks } from '@/lib/spotify';

export type PromoActionType = 'quiz' | 'bet' | 'boost';

export type ClaimPromoResult = {
    success: boolean;
    message: string;
    newScore?: number;
    pointsAwarded?: number;
    musiCoinsAwarded?: number;
    dropLabel?: string;
    error?: string;
    correctAnswerIndex?: number;
};

// Helper to determine artist category
function getArtistCategory(popularity: number): ArtistCategory {
    if (popularity >= ARTIST_TIERS.BIG.min) return 'Big';
    if (popularity >= ARTIST_TIERS.MID.min) return 'Mid';
    return 'New Gen';
}

export type DailyPromoState = {
    selectedArtistId: string | null;
    status: {
        quiz: boolean;
        bet: boolean;
        boost: boolean;
    };
    locked: boolean; // True if selected
    quizSnapshot?: {
        question: string;
        options: string[];
        type: string;
        userCorrect?: boolean | null;
    } | null;
    betSnapshot?: {
        rival: any;
        wager: 'my_artist' | 'rival' | 'draw' | null;
        status: 'pending' | 'won' | 'lost' | 'draw';
    } | null;
    boostSnapshot?: {
        options: any[]; // {id, label, url, icon, type}
        selected_id?: string | null;
        reward?: { type: 'points' | 'coins'; amount: number } | null;
    } | null;
};

export async function getDailyPromoStateAction(): Promise<DailyPromoState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { selectedArtistId: null, status: { quiz: false, bet: false, boost: false }, locked: false };

    const today = new Date().toISOString().split('T')[0];

    // Fetch daily promo row
    const { data: promo } = await supabase
        .from('daily_promos')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

    if (!promo) {
        return {
            selectedArtistId: null,
            status: { quiz: false, bet: false, boost: false },
            locked: false
        };
    }

    return {
        selectedArtistId: promo.artist_id,
        status: {
            quiz: promo.quiz_done,
            bet: promo.bet_done,
            boost: promo.boost_done
        },
        locked: true,
        quizSnapshot: promo.quiz_snapshot ? {
            question: promo.quiz_snapshot.text,
            options: promo.quiz_snapshot.options,
            type: promo.quiz_snapshot.type,
            userCorrect: promo.quiz_snapshot.userCorrect
        } : null,
        betSnapshot: promo.bet_snapshot ? {
            rival: promo.bet_snapshot.rival,
            wager: promo.bet_snapshot.wager,
            status: promo.bet_snapshot.status
        } : null,
        boostSnapshot: promo.boost_snapshot ? {
            options: promo.boost_snapshot.options,
            selected_id: promo.boost_snapshot.selected_id,
            reward: promo.boost_snapshot.reward
        } : null
    };
}

export async function selectDailyArtistAction(artistId: string): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];

        const { data: existing } = await supabase
            .from('daily_promos')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (existing) {
            return { success: false, message: 'Artist already selected for today' };
        }

        const { error } = await supabase
            .from('daily_promos')
            .insert({
                user_id: user.id,
                artist_id: artistId,
                date: today
            });

        if (error) {
            console.error('Select Artist Error:', error);
            return { success: false, message: 'Failed to select artist' };
        }

        revalidatePath('/dashboard');
        return { success: true, message: 'Artist selected!' };

    } catch (error) {
        console.error('Select Artist Exception:', error);
        return { success: false, message: 'Unexpected error' };
    }
}


export async function startQuizAction(artistId: string): Promise<{ success: boolean; quiz?: any; message?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: promo } = await supabase
            .from('daily_promos')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (!promo || promo.artist_id !== artistId) {
            return { success: false, message: 'Invalid promo session' };
        }

        if (promo.quiz_snapshot) {
            return {
                success: true,
                quiz: {
                    question: promo.quiz_snapshot.text,
                    options: promo.quiz_snapshot.options,
                    type: promo.quiz_snapshot.type
                }
            };
        }

        // Fetch Data
        const artist = await getArtist(artistId);
        if (!artist) return { success: false, message: 'Artist not found' };

        // Fetch Distractors from Cache directly
        const { data: pool } = await supabase
            .from('artists_cache')
            .select('spotify_id')
            .neq('spotify_id', artistId)
            .limit(20);

        const shuffledPool = (pool || []).sort(() => 0.5 - Math.random()).slice(0, 3);

        const distractors = [];
        for (const d of shuffledPool) {
            const dArtist = await getArtist(d.spotify_id);
            if (dArtist) {
                const dRel = await getArtistReleases(d.spotify_id);
                const dTracks = await getArtistTopTracks(d.spotify_id);
                distractors.push({
                    name: dArtist.name,
                    popularity: dArtist.popularity,
                    followers: dArtist.followers.total,
                    genres: dArtist.genres,
                    latestRelease: dRel?.[0] ? { name: dRel[0].name, type: dRel[0].album_type } : undefined,
                    topTracks: dTracks
                });
            }
        }

        // Fetch Target Details
        const releases = await getArtistReleases(artistId);
        const topTracks = await getArtistTopTracks(artistId);

        const artistData = {
            name: artist.name,
            popularity: artist.popularity,
            followers: artist.followers.total,
            genres: artist.genres,
            latestRelease: releases?.[0] ? { name: releases[0].name, type: releases[0].album_type } : undefined,
            topTracks: topTracks
        };

        const quiz = await generateQuiz(supabase, artistData, distractors);

        // Save Snapshot
        const { error } = await supabase
            .from('daily_promos')
            .update({ quiz_snapshot: quiz })
            .eq('id', promo.id);

        if (error) throw error;

        return {
            success: true,
            quiz: {
                question: quiz.text,
                options: quiz.options,
                type: quiz.type
            }
        };

    } catch (e) {
        console.error("Quiz Generation Error:", e);
        return { success: false, message: 'Failed to generate quiz' };
    }
}

export async function answerQuizAction(artistId: string, answerIndex: number): Promise<ClaimPromoResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: promo } = await supabase
            .from('daily_promos')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (!promo || !promo.quiz_snapshot) {
            return { success: false, message: 'No active quiz' };
        }

        if (promo.quiz_done) {
            return { success: false, message: 'Quiz already done' };
        }

        const isCorrect = promo.quiz_snapshot.correctAnswerIndex === answerIndex;
        const points = isCorrect ? QUIZ_CONFIG.POINTS_CORRECT : QUIZ_CONFIG.POINTS_INCORRECT;

        // Update Promo
        const { error } = await supabase
            .from('daily_promos')
            .update({
                quiz_done: true,
                total_points: (promo.total_points || 0) + points,
                quiz_snapshot: {
                    ...promo.quiz_snapshot,
                    userCorrect: isCorrect
                }
            })
            .eq('id', promo.id);

        if (error) throw error;

        // Award Points to Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('listen_score')
            .eq('id', user.id)
            .single();

        let newScore = (profile?.listen_score || 0) + points;

        if (profile) {
            await supabase
                .from('profiles')
                .update({ listen_score: newScore })
                .eq('id', user.id);
        }

        revalidatePath('/dashboard');

        return {
            success: true,
            message: isCorrect ? 'Correct!' : 'Wrong answer',
            pointsAwarded: points,
            newScore,
            correctAnswerIndex: promo.quiz_snapshot.correctAnswerIndex
        };

    } catch (e) {
        console.error(e);
        return { success: false, message: 'Error submitting answer' };
    }
}

export async function startBetAction(artistId: string): Promise<{ success: boolean; rival?: any; message?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: promo } = await supabase
            .from('daily_promos')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (!promo || promo.artist_id !== artistId) {
            return { success: false, message: 'Invalid promo session' };
        }

        if (promo.bet_snapshot) {
            return {
                success: true,
                rival: promo.bet_snapshot.rival
            };
        }

        // Fetch My Artist for Tier info
        const { data: myArtist } = await supabase
            .from('artists_cache')
            .select('*')
            .eq('spotify_id', artistId)
            .maybeSingle();

        if (!myArtist) return { success: false, message: 'Artist not found' };

        const myTier = getArtistCategory(myArtist.current_popularity);
        const tierRange = ARTIST_TIERS[myTier === 'New Gen' ? 'NEW_GEN' : myTier === 'Mid' ? 'MID' : 'BIG'];

        // Get User Team to exclude
        const { data: teams } = await supabase
            .from('teams')
            .select('slot_1_id, slot_2_id, slot_3_id, slot_4_id, slot_5_id')
            .eq('user_id', user.id)
            .order('week_number', { ascending: false })
            .limit(1);

        const currentTeam = teams?.[0] || {};
        const teamIds = Object.values(currentTeam).filter(Boolean) as string[];

        // Find Rival
        // Ideally same tier, not in team, not the artist itself
        const { data: potentialRivals } = await supabase
            .from('artists_cache')
            .select('*')
            .gte('current_popularity', tierRange.min)
            .lte('current_popularity', tierRange.max)
            .neq('spotify_id', artistId);

        // Filter out team members client-side (or could do 'not.in' if list is small)
        const validRivals = (potentialRivals || []).filter(a => !teamIds.includes(a.spotify_id));

        if (validRivals.length === 0) {
            // Fallback to any artist not in team if strict tier matching fails
            // (Simple handle: just pick random from full cache if needed, but for now assuming cache has enough)
            return { success: false, message: 'No valid rival found' };
        }

        const rival = validRivals[Math.floor(Math.random() * validRivals.length)];

        const rivalData = {
            id: rival.spotify_id,
            name: rival.name,
            image: rival.image_url,
            popularity: rival.current_popularity
        };

        const snapshot = {
            rival: rivalData,
            wager: null,
            status: 'pending',
            scores: null
        };

        const { error } = await supabase
            .from('daily_promos')
            .update({ bet_snapshot: snapshot })
            .eq('id', promo.id);

        if (error) throw error;

        return {
            success: true,
            rival: rivalData
        };

    } catch (e) {
        console.error("Start Bet Error:", e);
        return { success: false, message: 'Failed to start bet' };
    }
}

import { BOOST_CONFIG, BET_CONFIG } from '@/config/promo';

export async function placeBetAction(artistId: string, prediction: 'my_artist' | 'rival' | 'draw'): Promise<ClaimPromoResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: promo } = await supabase
            .from('daily_promos')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (!promo || !promo.bet_snapshot) {
            return { success: false, message: 'No active bet session' };
        }

        if (promo.bet_done) {
            return { success: false, message: 'Scommessa già piazzata' };
        }

        // MusiBets are now free, so no cost deduction needed

        // Fetch current week number to ensure baseline is from the active week
        const { data: latestSnap } = await supabase
            .from('weekly_snapshots')
            .select('week_number')
            .order('week_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        const currentWeekNumber = latestSnap?.week_number || 1;

        // Fetch current weekly scores to establish a baseline ONLY for the current week
        const { data: scores } = await supabase
            .from('weekly_scores')
            .select('artist_id, total_points')
            .in('artist_id', [artistId, promo.bet_snapshot.rival.id])
            .eq('week_number', currentWeekNumber);

        const myStartScore = scores?.find(s => s.artist_id === artistId)?.total_points || 0;
        const rivalStartScore = scores?.find(s => s.artist_id === promo.bet_snapshot.rival.id)?.total_points || 0;

        // Update Snapshot with wager and initial scores
        const newSnapshot = {
            ...promo.bet_snapshot,
            wager: prediction,
            week_number: currentWeekNumber,
            initial_scores: {
                my: myStartScore,
                rival: rivalStartScore
            }
        };

        const { error } = await supabase
            .from('daily_promos')
            .update({
                bet_snapshot: newSnapshot,
                bet_done: true
            })
            .eq('id', promo.id);

        if (error) throw error;

        revalidatePath('/dashboard');

        return {
            success: true,
            message: `Scommessa piazzata!`,
            musiCoinsAwarded: 0 // No coins yet, delayed result
        };

    } catch (e) {
        console.error("Place Bet Error:", e);
        return { success: false, message: 'Failed to place bet' };
    }
}

export async function markBetSeenAction(promoId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('daily_promos')
        .update({ bet_result_seen: true })
        .eq('id', promoId);

    if (error) console.error("Mark Bet Seen Error:", error);
    revalidatePath('/dashboard');
}

export async function getPendingBetResultAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: promo } = await supabase
        .from('daily_promos')
        .select('id, bet_snapshot, artist_id')
        .eq('user_id', user.id)
        .eq('bet_resolved', true)
        .eq('bet_result_seen', false)
        .limit(1)
        .maybeSingle();

    if (!promo) return null;

    // Fetch my artist name for UI
    const { data: artist } = await supabase
        .from('artists_cache')
        .select('name')
        .eq('spotify_id', promo.artist_id)
        .single();

    return {
        id: promo.id,
        betSnapshot: {
            ...promo.bet_snapshot,
            my_artist_name: artist?.name || 'Il Tuo Artista'
        }
    };
}

// ------------------------------------------------------------------
// MUSIBOOST ACTIONS
// ------------------------------------------------------------------


export async function startBoostAction(artistId: string): Promise<{ success: boolean; options?: any[]; message?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: promo } = await supabase
            .from('daily_promos')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (!promo || promo.artist_id !== artistId) {
            return { success: false, message: 'Invalid promo session' };
        }

        if (promo.boost_snapshot) {
            return {
                success: true,
                options: promo.boost_snapshot.options
            };
        }

        // Fetch Artist Data
        const artist = await getArtist(artistId);
        if (!artist) return { success: false, message: 'Artist not found' };
        const releases = await getArtistReleases(artistId);

        // Randomly select 2 unique templates
        const templates = [...BOOST_CONFIG.ACTION_TEMPLATES];
        const shuffled = templates.sort(() => 0.5 - Math.random());
        const selectedTemplates = shuffled.slice(0, 2);

        const selectedOptions = selectedTemplates.map(tpl => {
            // Priority: URL from tpl if available, else artist profile (clean)
            let url = artist.external_urls.spotify.split('?')[0];

            if (tpl.id === 'latest' && releases?.[0]) {
                url = releases[0].external_urls.spotify.split('?')[0];
            } else if (tpl.id === 'revival' && releases && releases.length > 1) {
                // Pick a "classic" (not the newest 2)
                const index = releases.length > 2 ? 2 + Math.floor(Math.random() * (releases.length - 2)) : 1;
                const revUrl = releases[index]?.external_urls.spotify;
                if (revUrl) url = revUrl.split('?')[0];
            } else if (tpl.id === 'discography') {
                url = `${artist.external_urls.spotify.split('?')[0]}/discography`;
            } else if (tpl.id === 'top_tracks') {
                url = artist.external_urls.spotify.split('?')[0]; // Profile usually shows top tracks first
            } else if (tpl.id === 'metrics') {
                url = artist.external_urls.spotify.split('?')[0]; // Fallback for metrics
            } else if (tpl.id === 'radio') {
                url = artist.external_urls.spotify.split('?')[0]; // Fallback
            }

            return {
                id: tpl.id,
                label: tpl.label,
                subLabel: tpl.subLabel,
                icon: tpl.icon,
                type: tpl.type,
                url
            };
        });

        const snapshot = {
            options: selectedOptions,
            selected_id: null,
            reward: null
        };

        const { error } = await supabase
            .from('daily_promos')
            .update({ boost_snapshot: snapshot })
            .eq('id', promo.id);

        if (error) throw error;

        return {
            success: true,
            options: selectedOptions
        };

    } catch (e) {
        console.error("Start Boost Error:", e);
        return { success: false, message: 'Failed to start boost' };
    }
}

export async function claimBoostAction(artistId: string, optionId: string): Promise<ClaimPromoResult & { url?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: promo } = await supabase
            .from('daily_promos')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (!promo || !promo.boost_snapshot) {
            return { success: false, message: 'No active boost session' };
        }

        if (promo.boost_done) {
            return { success: false, message: 'Boost already accumulated' };
        }

        const selectedOption = promo.boost_snapshot.options.find((o: any) => o.id === optionId);
        if (!selectedOption) {
            return { success: false, message: 'Invalid option selected' };
        }

        // Determine Reward Logic (Randomized Points 2-10)
        const distribution = BOOST_CONFIG.REWARDS.POINTS_DISTRIBUTION;
        const totalWeight = distribution.reduce((acc, curr) => acc + curr.weight, 0);
        let random = Math.floor(Math.random() * totalWeight);

        let selectedPoints = 2;
        for (const item of distribution) {
            if (random < item.weight) {
                selectedPoints = item.points;
                break;
            }
            random -= item.weight;
        }

        const reward = {
            type: 'points' as const,
            amount: selectedPoints
        };

        const points = reward.amount;
        const coins = 0;

        // Update Snapshot (Selection Only - NO mark as done yet)
        const newSnapshot = {
            ...promo.boost_snapshot,
            selected_id: optionId,
            reward: reward
        };

        const { error } = await supabase
            .from('daily_promos')
            .update({
                boost_snapshot: newSnapshot
            })
            .eq('id', promo.id);

        if (error) throw error;

        return {
            success: true,
            message: 'Points Collected!',
            pointsAwarded: points,
            url: selectedOption.url
        };

    } catch (e) {
        console.error("Claim Boost Error:", e);
        return { success: false, message: 'Failed to claim boost' };
    }
}

export async function finalizeBoostAction(artistId: string): Promise<ClaimPromoResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: promo } = await supabase
            .from('daily_promos')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (!promo || !promo.boost_snapshot || !promo.boost_snapshot.reward) {
            return { success: false, message: 'Invalid or missing boost reward' };
        }

        if (promo.boost_done) {
            return { success: true, message: 'Already done' };
        }

        const reward = promo.boost_snapshot.reward;
        const points = reward.type === 'points' ? reward.amount : 0;

        // Update Promo Flags (Done + Accreditation)
        const { error: updateError } = await supabase
            .from('daily_promos')
            .update({
                boost_done: true,
                total_points: (promo.total_points || 0) + points
            })
            .eq('id', promo.id);

        if (updateError) throw updateError;

        // Update Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('listen_score')
            .eq('id', user.id)
            .maybeSingle();

        if (profile && user && points > 0) {
            const newScore = (profile.listen_score || 0) + points;
            await supabase
                .from('profiles')
                .update({ listen_score: newScore })
                .eq('id', user.id);
        }

        revalidatePath('/dashboard');
        return { success: true, message: 'Boost finalized' };

    } catch (e) {
        console.error("Finalize Boost Error:", e);
        return { success: false, message: 'Failed to finalize boost' };
    }
}
