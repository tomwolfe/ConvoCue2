const INTENT_PATTERNS = {
    social: {
        keywords: ['hello', 'hi', 'how are you', 'nice to meet', 'weather', 'party', 'weekend', 'name', 'thanks'],
        weight: 1
    },
    professional: {
        keywords: ['project', 'meeting', 'deadline', 'report', 'client', 'strategy', 'goal', 'agenda', 'update', 'feedback'],
        weight: 1.2
    },
    conflict: {
        keywords: ['disagree', 'wrong', 'mistake', 'fail', 'issue', 'problem', 'not true', 'but', 'actually', 'unacceptable'],
        weight: 1.5
    },
    empathy: {
        keywords: ['understand', 'feel', 'difficult', 'hard', 'support', 'help', 'sorry to hear', 'bummer', 'that sucks'],
        weight: 1.3
    }
};

export const detectIntent = (text) => {
    if (!text) return 'general';
    
    const lowerText = text.toLowerCase();
    const scores = {
        social: 0,
        professional: 0,
        conflict: 0,
        empathy: 0
    };

    for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
        config.keywords.forEach(kw => {
            if (lowerText.includes(kw)) {
                scores[intent] += config.weight;
            }
        });
    }

    if (lowerText.includes('sorry but') || lowerText.includes('sorry, but')) {
        scores.conflict += 2;
        scores.empathy -= 1;
    }

    let bestIntent = 'general';
    let maxScore = 0.5;

    for (const [intent, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestIntent = intent;
        }
    }

    return bestIntent;
};
