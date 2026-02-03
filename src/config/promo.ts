export type ArtistCategory = 'Big' | 'Mid' | 'New Gen';

export const QUIZ_CONFIG = {
    POINTS_CORRECT: 5,
    POINTS_INCORRECT: 1
} as const;

export interface LuckyDropTier {
    probability: number; // 0.0 to 1.0 (e.g. 0.05 is 5%)
    amount: number;      // Amount of MusiCoins
    label: string;       // For UI display (e.g. "Rare Drop")
}


export const BET_CONFIG = {
    ENTRY_FEE: 2, // Cost in MusiCoins to place a bet
    POINTS_REWARD: 5,
    COINS_REWARD: 4
} as const;

export const BOOST_CONFIG = {
    ACTION_TEMPLATES: [
        { id: 'revival', label: 'Boost Revival', subLabel: 'Sostieni un Classico', icon: 'Rocket', type: 'revival' },
        { id: 'latest', label: 'Push Latest Release', subLabel: 'Promuovi l\'ultima uscita', icon: 'Music2', type: 'latest' },
        { id: 'metrics', label: 'Check Metrics', subLabel: 'Analisi Profilo Spotify', icon: 'TrendingUp', type: 'metrics' },
        { id: 'top_tracks', label: 'Hit Parade', subLabel: 'Ascolta le più amate', icon: 'Trophy', type: 'top_tracks' },
        { id: 'discography', label: 'Discografia', subLabel: 'Esplora tutti gli album', icon: 'Library', type: 'discography' },
        { id: 'radio', label: 'Artist Radio', subLabel: 'Scopri brani simili', icon: 'Radio', type: 'radio' }
    ],
    REWARDS: {
        POINTS_AMOUNT: 2,
        COINS_PROBABILITY: 0.1, // 10% chance
        COINS_AMOUNT: 2
    }
} as const;
