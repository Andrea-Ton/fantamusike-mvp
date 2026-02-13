export const ARTIST_TIERS = {
    BIG: {
        label: 'Star',
        min: 76,
        max: 100
    },
    MID: {
        label: 'Popular',
        min: 46,
        max: 75
    },
    NEW_GEN: {
        label: 'Underdog',
        min: 0,
        max: 45
    }
} as const;

export type ArtistTierKey = keyof typeof ARTIST_TIERS;
export const ARTIST_TIER_KEYS: ArtistTierKey[] = ['BIG', 'MID', 'NEW_GEN'];

export const REFERRAL_LIMIT = 10;
export const REFERRAL_BONUS = 30;
