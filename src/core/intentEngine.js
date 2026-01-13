import { INTENT_PATTERNS } from './config';

// Pre-compile regex for performance and accuracy (word boundaries)
const COMPILED_PATTERNS = Object.entries(INTENT_PATTERNS).map(([intent, config]) => {
    // Escape keywords and join with word boundaries
    const pattern = config.keywords
        .map(kw => {
            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return `\\b${escaped}\\b`;
        })
        .join('|');
    return {
        intent,
        regex: new RegExp(pattern, 'gi'),
        weight: config.weight
    };
});

const NUANCE_PATTERNS = [
    { regex: /\b(sorry but|sorry, but|i hear you but)\b/gi, conflict: 2.5, empathy: -1 },
    { regex: /\b(not sure|maybe|perhaps)\b/gi, social: 0.5 },
    // Negation check: if "don't disagree" or "no problem", reduce conflict
    { regex: /\b(don't|do not|doesn't|does not|no|not)\s+\b(disagree|wrong|problem|issue|mistake)\b/gi, conflict: -3 }
];

export const detectIntent = (text) => {
    if (!text || text.trim().length < 3) return 'general';
    
    const scores = {
        social: 0,
        professional: 0,
        conflict: 0,
        empathy: 0
    };

    // Check pre-compiled patterns
    for (const { intent, regex, weight } of COMPILED_PATTERNS) {
        const matches = text.match(regex);
        if (matches) {
            matches.forEach(match => {
                // Higher weight for multi-word phrase matches
                const multiplier = match.includes(' ') ? 1.5 : 1;
                scores[intent] += weight * multiplier;
            });
        }
    }

    // Apply nuance adjustments
    for (const { regex, ...adjustments } of NUANCE_PATTERNS) {
        const matches = text.match(regex);
        if (matches) {
            matches.forEach(() => {
                for (const [intent, adjustment] of Object.entries(adjustments)) {
                    scores[intent] += adjustment;
                }
            });
        }
    }

    let bestIntent = 'general';
    let maxScore = 0.8; // Baseline threshold to avoid noise

    for (const [intent, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestIntent = intent;
        }
    }

    return bestIntent;
};
