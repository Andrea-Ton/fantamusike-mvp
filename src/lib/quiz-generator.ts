import { SupabaseClient } from '@supabase/supabase-js';

export type QuestionType =
    | 'follower_count'
    | 'genre'
    | 'latest_release_name'
    | 'album_ownership'
    | 'top_track'
    | 'release_type'
    | 'popularity_tier';

export interface QuizQuestion {
    text: string;
    options: string[];
    correctAnswerIndex: number;
    type: QuestionType;
}

interface ArtistData {
    name: string;
    popularity: number;
    followers: number;
    genres: string[];
    latestRelease?: {
        name: string;
        type: string; // 'album', 'single', 'compilation'
    };
    topTracks?: string[]; // Array of track names
    albums?: string[]; // Array of album names
}

// Helper to shuffle array
function shuffle<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

export async function generateQuiz(
    supabase: SupabaseClient,
    artist: ArtistData,
    distractors: ArtistData[]
): Promise<QuizQuestion> {
    const availableTypes: QuestionType[] = ['follower_count', 'popularity_tier', 'release_type'];

    if (artist.genres && artist.genres.length > 0) availableTypes.push('genre');
    if (artist.latestRelease) availableTypes.push('latest_release_name');
    if (artist.topTracks && artist.topTracks.length > 0) availableTypes.push('top_track');
    // For album ownership, we need artist albums. If we don't have them in 'albums' prop (which we might fetch from spotify), we might skip or use 'latestRelease' if it's an album.
    // For MVP transparency, let's assume 'latestRelease' allows us to do 'latest_release_name' well.
    // 'album_ownership' is better if we have a full discography, let's keep it simple for now or use topTracks.
    // Let's stick to the ones we can robustly generate.

    // Helper: Pick Random Type
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    switch (type) {
        case 'follower_count':
            return generateFollowerQuestion(artist);
        case 'popularity_tier':
            return generatePopularityQuestion(artist);
        case 'genre':
            return generateGenreQuestion(artist, distractors);
        case 'latest_release_name':
            return generateLatestReleaseQuestion(artist, distractors);
        case 'top_track':
            return generateTopTrackQuestion(artist, distractors);
        case 'release_type':
            return generateReleaseTypeQuestion(artist);
        default:
            return generateFollowerQuestion(artist); // Fallback
    }
}

// --- Generators ---

function generateFollowerQuestion(artist: ArtistData): QuizQuestion {
    const isTrue = Math.random() > 0.5;
    // Create a threshold close to actual followers
    const variance = Math.floor(artist.followers * 0.3); // +/- 30%
    let threshold = isTrue
        ? Math.floor(artist.followers - variance) // True: has more than (Actual - 30%)
        : Math.floor(artist.followers + variance); // False: has more than (Actual + 30%)

    // Round nicely
    if (threshold > 1000000) threshold = Math.floor(threshold / 100000) * 100000;
    else if (threshold > 10000) threshold = Math.floor(threshold / 1000) * 1000;

    return {
        text: `${artist.name} ha più di ${threshold.toLocaleString('it-IT')} followers su Spotify?`,
        options: ['Vero', 'Falso'],
        correctAnswerIndex: isTrue ? 0 : 1,
        type: 'follower_count'
    };
}

function generatePopularityQuestion(artist: ArtistData): QuizQuestion {
    // Tiers: 0-20 (Nicchia), 21-40 (Emergente), 41-60 (Affermato), 61-80 (Mainstream), 81-100 (Superstar)
    const getTier = (pop: number) => {
        if (pop <= 40) return 'Emergente (0-40)';
        if (pop <= 60) return 'Affermato (41-60)';
        if (pop <= 80) return 'Mainstream (61-80)';
        return 'Superstar (81-100)';
    };

    const correct = getTier(artist.popularity);
    const allTiers = ['Emergente (0-40)', 'Affermato (41-60)', 'Mainstream (61-80)', 'Superstar (81-100)'];
    // Remove correct and pick 3 random distractors
    const wrong = allTiers.filter(t => t !== correct).slice(0, 3);
    const options = shuffle([correct, ...wrong]);

    return {
        text: `In che fascia di popolarità Spotify si trova ${artist.name} oggi?`,
        options: options,
        correctAnswerIndex: options.indexOf(correct),
        type: 'popularity_tier'
    };
}

function generateGenreQuestion(artist: ArtistData, distractors: ArtistData[]): QuizQuestion {
    const correct = artist.genres[0] || 'Pop'; // Fallback
    // Collect unique distractor genres
    const wrongGenes = new Set<string>();
    distractors.forEach(d => {
        d.genres.forEach(g => {
            if (g !== correct && !artist.genres.includes(g)) wrongGenes.add(g);
        });
    });

    // Fill up to 3 wrong answers
    const wrong = Array.from(wrongGenes).slice(0, 3);
    // If not enough, pad with generics
    const generics = ['Rock', 'Jazz', 'Classical', 'Metal'];
    let i = 0;
    while (wrong.length < 3) {
        if (!wrong.includes(generics[i]) && generics[i] !== correct) wrong.push(generics[i]);
        i++;
    }

    const options = shuffle([correct, ...wrong]);

    return {
        text: `Quale tra questi è un genere musicale associato a ${artist.name}?`,
        options: options,
        correctAnswerIndex: options.indexOf(correct),
        type: 'genre'
    };
}

function generateLatestReleaseQuestion(artist: ArtistData, distractors: ArtistData[]): QuizQuestion {
    const correct = artist.latestRelease?.name || 'Unknown';

    const wrong = distractors
        .map(d => d.latestRelease?.name)
        .filter(n => n && n !== correct)
        .slice(0, 3) as string[];

    while (wrong.length < 3) {
        wrong.push(`Track ${wrong.length + 1}`); // Should rarely happen given DB size
    }

    const options = shuffle([correct, ...wrong]);

    return {
        text: `Come si chiama l'ultima uscita di ${artist.name}?`,
        options: options,
        correctAnswerIndex: options.indexOf(correct),
        type: 'latest_release_name'
    };
}

function generateTopTrackQuestion(artist: ArtistData, distractors: ArtistData[]): QuizQuestion {
    const correct = artist.topTracks?.[0] || 'Unknown';

    // Pick top tracks from distractors
    const wrong = distractors
        .map(d => d.topTracks?.[0])
        .filter(t => t && t !== correct)
        .slice(0, 3) as string[];

    while (wrong.length < 3) {
        wrong.push(`Song ${wrong.length + 1}`);
    }

    const options = shuffle([correct, ...wrong]);

    return {
        text: `Quale di questi brani è una delle hit di ${artist.name}?`,
        options: options,
        correctAnswerIndex: options.indexOf(correct),
        type: 'top_track'
    };
}

function generateReleaseTypeQuestion(artist: ArtistData): QuizQuestion {
    const releaseName = artist.latestRelease?.name || 'Latest Release';
    const correctType = artist.latestRelease?.type || 'single';

    // Normalize type for display
    const mapType = (t: string) => {
        if (t === 'album') return 'Album';
        if (t === 'single') return 'Singolo';
        if (t === 'compilation') return 'Raccolta';
        return 'EP';
    };

    const correct = mapType(correctType);
    const options = shuffle(['Album', 'Singolo', 'EP', 'Raccolta']);

    return {
        text: `L'ultima uscita "${releaseName}" di ${artist.name} è un:`,
        options: options,
        correctAnswerIndex: options.indexOf(correct),
        type: 'release_type'
    };
}
