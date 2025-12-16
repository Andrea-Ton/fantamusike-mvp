
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
