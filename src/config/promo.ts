export const PROMO_POINTS = {
    Big: {
        profile_click: 1,
        release_click: 1,
        share: 1
    },
    Mid: {
        profile_click: 1,
        release_click: 2,
        share: 1
    },
    'New Gen': {
        profile_click: 3,
        release_click: 3,
        share: 3
    }
} as const;

export type ArtistCategory = keyof typeof PROMO_POINTS;

export interface LuckyDropTier {
    probability: number; // 0.0 to 1.0 (e.g. 0.05 is 5%)
    amount: number;      // Amount of MusiCoins
    label: string;       // For UI display (e.g. "Rare Drop")
}

export const PROMO_LUCKY_DROP: Record<ArtistCategory, LuckyDropTier[]> = {
    Big: [
        { probability: 0.01, amount: 20, label: "Legendary Drop" },
        { probability: 0.08, amount: 2, label: "Lucky Drop" }
    ],
    Mid: [
        { probability: 0.04, amount: 30, label: "Legendary Drop" },
        { probability: 0.15, amount: 3, label: "Lucky Drop" }
    ],
    'New Gen': [
        { probability: 0.5, amount: 40, label: "Legendary Drop" },
        { probability: 0.5, amount: 5, label: "Lucky Drop" }
    ]
};
