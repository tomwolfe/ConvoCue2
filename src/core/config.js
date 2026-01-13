export const INTENT_PATTERNS = {
    social: {
        keywords: [
            'hello', 'hi', 'how are you', 'nice to meet', 'weather', 'party', 'weekend', 
            'name', 'thanks', 'cool', 'awesome', 'fun', 'plans', 'hobbies', 'family',
            'vacation', 'trip', 'recommend', 'favorite', 'dinner', 'lunch', 'drink'
        ],
        weight: 1
    },
    professional: {
        keywords: [
            'project', 'meeting', 'deadline', 'report', 'client', 'strategy', 'goal', 
            'agenda', 'update', 'feedback', 'workflow', 'resource', 'budget', 'roadmap',
            'stakeholder', 'quarterly', 'deliverable', 'action item', 'sync', 'call',
            'colleague', 'manager', 'director', 'presentation'
        ],
        weight: 1.2
    },
    conflict: {
        keywords: [
            'disagree', 'wrong', 'mistake', 'fail', 'issue', 'problem', 'not true', 
            'but', 'actually', 'unacceptable', 'frustrated', 'no way', 'impossible',
            'refuse', 'blame', 'error', 'delay', 'broken', 'unfair', 'uncomfortable',
            'nonsense', 'ridiculous', 'offended', 'annoyed'
        ],
        weight: 1.5
    },
    empathy: {
        keywords: [
            'understand', 'feel', 'difficult', 'hard', 'support', 'help', 'sorry to hear', 
            'bummer', 'that sucks', 'tough', 'exhausting', 'sorry', 'apologize', 
            'listen', 'there for you', 'hear you', 'valid', 'mean a lot', 'appreciate',
            'supportive', 'kind', 'brave'
        ],
        weight: 1.3
    }
};

export const PARETO_PERSONAS = {
    anxiety: {
        label: 'Anxiety Coach',
        icon: 'ShieldAlert',
        drainRate: 1.5,
        examples: [
            { context: 'SOCIAL', input: 'Hey, how was your weekend?', suggestion: 'It was great, thanks! How about yours?' },
            { context: 'EXHAUSTED', input: 'So what do you think about the new policy?', suggestion: "I'm still processing it. Mind if we chat later?" }
        ],
        prompt: `You are a warm, supportive social coach for someone with social anxiety. 
        Focus: Provide low-pressure, validating cues that bridge silence or offer easy exits. 
        Style: Gentle, encouraging, minimal.
        - If SOCIAL: Suggest a simple, open-ended question.
        - If CONFLICT: Suggest a softening phrase to de-escalate.
        - If EXHAUSTED: Suggest a polite way to leave the conversation.`
    },
    professional: {
        label: 'Pro Exec',
        icon: 'Briefcase',
        drainRate: 1.0,
        examples: [
            { context: 'PROFESSIONAL', input: 'The project is behind schedule.', suggestion: 'What are the top three blockers we can resolve now?' },
            { context: 'CONFLICT', input: "I don't think your approach will work.", suggestion: 'I appreciate the feedback. What alternative do you propose?' }
        ],
        prompt: `You are a high-level executive coach for a busy professional. 
        Focus: Project confidence, clarity, and strategic alignment. 
        Style: Concise, authoritative, direct.
        - If PROFESSIONAL: Focus on 'next steps' or 'key takeaways'.
        - If CONFLICT: Use 'radical candor' - direct but deeply caring.
        - If EXHAUSTED: Suggest a concise way to wrap up the meeting.`
    },
    relationship: {
        label: 'EQ Coach',
        icon: 'Heart',
        drainRate: 0.8,
        examples: [
            { context: 'EMPATHY', input: 'I had a really rough day at work.', suggestion: "That sounds incredibly draining. I'm here to listen." },
            { context: 'CONFLICT', input: 'You never listen to me!', suggestion: "I hear that you're feeling unheard. Can we try that again?" }
        ],
        prompt: `You are an expert in Emotional Intelligence and deep connection. 
        Focus: Deepen connection, validation, and emotional labeling.
        Style: Empathetic, warm, reflective.
        - If EMPATHY: Use 'I' statements or validate the other person's feeling.
        - If CONFLICT: Suggest active listening or a 'pause' for reflection.
        - If EXHAUSTED: Suggest a warm, authentic way to end the interaction.`
    },
    crosscultural: {
        label: 'Culture Guide',
        icon: 'Globe',
        drainRate: 1.2,
        examples: [
            { context: 'SOCIAL', input: 'Is it okay to talk about politics here?', suggestion: "People usually prefer lighter topics initially. Maybe ask about local food?" },
            { context: 'CONFLICT', input: 'Your team is not following the protocol.', suggestion: 'Could you help me understand the expected workflow better?' }
        ],
        prompt: `You are a cross-cultural communication expert. 
        Focus: Navigate high/low context differences and save face.
        Style: Observant, diplomatic, clear.
        - If SOCIAL: Suggest inclusive, clear language.
        - If CONFLICT: Suggest 'saving face' techniques or indirect feedback.
        - If EXHAUSTED: Suggest a culturally appropriate exit.`
    }
};

export const AppConfig = {
    personas: PARETO_PERSONAS,
    defaultPersona: 'anxiety',
    batteryDeduction: {
        baseRate: 0.1,
        multipliers: {
            social: 0.8,
            professional: 1.2,
            conflict: 2.0,
            empathy: 1.1,
            general: 1.0
        }
    },
    minBatteryThreshold: 20,
    agency: {
        sensitivityOptions: [
            { label: 'Low', value: 0.5 },
            { label: 'Normal', value: 1.0 },
            { label: 'High', value: 1.5 }
        ],
        defaultSensitivity: 1.0
    }
};
