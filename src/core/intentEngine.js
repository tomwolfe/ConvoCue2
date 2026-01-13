const INTENT_PATTERNS = {
    social: {
        keywords: [
            'hello', 'hi', 'how are you', 'nice to meet', 'weather', 'party', 'weekend', 
            'name', 'thanks', 'cool', 'awesome', 'fun', 'plans', 'hobbies', 'family',
            'vacation', 'trip', 'recommend', 'favorite'
        ],
        weight: 1
    },
    professional: {
        keywords: [
            'project', 'meeting', 'deadline', 'report', 'client', 'strategy', 'goal', 
            'agenda', 'update', 'feedback', 'workflow', 'resource', 'budget', 'roadmap',
            'stakeholder', 'quarterly', 'deliverable', 'action item', 'sync', 'call'
        ],
        weight: 1.2
    },
    conflict: {
        keywords: [
            'disagree', 'wrong', 'mistake', 'fail', 'issue', 'problem', 'not true', 
            'but', 'actually', 'unacceptable', 'frustrated', 'no way', 'impossible',
            'refuse', 'blame', 'error', 'delay', 'broken', 'unfair', 'uncomfortable'
        ],
        weight: 1.5
    },
    empathy: {
        keywords: [
            'understand', 'feel', 'difficult', 'hard', 'support', 'help', 'sorry to hear', 
            'bummer', 'that sucks', 'tough', 'exhausting', 'sorry', 'apologize', 
            'listen', 'there for you', 'hear you', 'valid', 'mean a lot'
        ],
        weight: 1.3
    }
};

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
    { regex: /\b(not sure|maybe|perhaps)\b/gi, social: 0.5 }
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
        if (regex.test(text)) {
            for (const [intent, adjustment] of Object.entries(adjustments)) {
                scores[intent] += adjustment;
            }
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
