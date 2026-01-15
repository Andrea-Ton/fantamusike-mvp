import { BANNED_TERMS } from './banned-terms';

interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validateUsername(username: string): ValidationResult {
    if (!username) {
        return { valid: false, error: 'Lo username è obbligatorio.' };
    }

    if (username.length < 3) {
        return { valid: false, error: 'Lo username deve avere almeno 3 caratteri.' };
    }

    if (username.length > 20) {
        return { valid: false, error: 'Lo username non può superare i 20 caratteri.' };
    }

    // Allow only alphanumeric, underscores, and dots.
    const validCharRegex = /^[a-zA-Z0-9_.]+$/;
    if (!validCharRegex.test(username)) {
        return { valid: false, error: 'Lo username può contenere solo lettere, numeri, punti e underscore.' };
    }

    // Check for banned terms (case-insensitive substring check)
    const lowerUsername = username.toLowerCase();

    for (const term of BANNED_TERMS) {
        if (lowerUsername.includes(term.toLowerCase())) {
            return { valid: false, error: 'Lo username contiene termini non consentiti.' };
        }
    }

    return { valid: true };
}
