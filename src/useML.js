import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { detectIntent, shouldGenerateSuggestion, getPrecomputedSuggestion, detectTurnTake, detectSpeakerHint } from './core/intentEngine';
import { AppConfig, BRIDGE_PHRASES, QUICK_ACTIONS } from './core/config';
import { useSocialBattery } from './hooks/useSocialBattery';
import { useTranscript } from './hooks/useTranscript';
import { useAIWorker } from './hooks/useAIWorker';
import { useAudioProcessor } from './hooks/useAudioProcessor';

export const useML = (initialState = null) => {
    // State
    const [suggestion, setSuggestion] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [detectedIntent, setDetectedIntent] = useState('general');
    const [persona, setPersona] = useState(AppConfig.defaultPersona);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    // Refs for caching and tracking
    const lastManualToggleRef = useRef(0);
    const lastSuggestionTimeRef = useRef(0);
    const speakerConfidenceRef = useRef({ me: 0, them: 0 });
    const suggestionCache = useRef(new Map());
    const intentHistory = useRef([]);
    const messagesRef = useRef([]);
    const initialBatteryRef = useRef(100);

    // Child Hooks
    const {
        battery, deduct, reset: resetBattery, batteryRef, setBattery,
        sensitivity, setSensitivity, isPaused, togglePause, recharge, isExhausted, lastDrain
    } = useSocialBattery();

    const {
        transcript, addEntry, currentSpeaker, setCurrentSpeaker, toggleSpeaker: baseToggleSpeaker, clearTranscript,
        shouldPulse, nudgeSpeaker, consecutiveCount, setTranscript
    } = useTranscript();

    // Fast lookup for common phrases
    const fastLookupMap = useMemo(() => new Map([
        ['hello', { intent: 'social', suggestion: 'Hi there! How are you doing today?' }],
        ['hi', { intent: 'social', suggestion: 'Hello! Nice to meet you.' }],
        ['hey', { intent: 'social', suggestion: 'Hey! What\'s up?' }],
        ['how are you', { intent: 'social', suggestion: 'I\'m doing well, thank you! How about yourself?' }],
        ['how\'s it going', { intent: 'social', suggestion: 'Pretty good! How about with you?' }],
        ['i had a rough day', { intent: 'empathy', suggestion: 'I\'m sorry to hear that. What happened?' }],
        ['i don\'t agree', { intent: 'conflict', suggestion: 'I see where you\'re coming from. Can we find common ground?' }]
    ]), []);

    // Callbacks for Worker results
    const handleSTTResult = useCallback((text) => {
        processText(text);
    }, []);

    const handleLLMResult = useCallback((sug, taskId) => {
        const intent = detectedIntent;
        const recentIntents = intentHistory.current
            .filter(item => Date.now() - item.timestamp < 30000)
            .map(item => item.intent)
            .slice(-3)
            .join('_');

        const cacheKey = `${intent}_${recentIntents}_${persona}_${battery > AppConfig.minBatteryThreshold ? 'normal' : 'exhausted'}`;
        suggestionCache.current.set(cacheKey, { text: sug, timestamp: Date.now() });

        setSuggestion(sug);
        lastSuggestionTimeRef.current = Date.now();
        setIsProcessing(false);
    }, [detectedIntent, persona, battery]);

    const handleSummaryResult = useCallback((summary) => {
        setSessionSummary(summary);
        setIsSummarizing(false);
        setSummaryError(null);
    }, []);

    const handleLLMError = useCallback((error) => {
        console.error('LLM error:', error);
        setIsProcessing(false);
        setIsSummarizing(false);
        setSummaryError(error);
    }, []);

    // Worker Hook
    const {
        sttReady, llmReady, sttProgress, llmProgress, sttStage, llmStage,
        runSTT, runLLM, runSummarize, lastTaskId
    } = useAIWorker(handleSTTResult, handleLLMResult, handleSummaryResult, handleLLMError);

    // Audio Processor Hook
    const { processAudio, resetAudio } = useAudioProcessor(
        runSTT,
        currentSpeaker,
        setCurrentSpeaker,
        lastManualToggleRef,
        speakerConfidenceRef
    );

    // Haptic Feedback for social cues
    const triggerSocialVibration = useCallback((type) => {
        if (!('vibrate' in navigator)) return;

        switch (type) {
            case 'conflict':
                navigator.vibrate([100, 50, 100]); // Double pulse for warning
                break;
            case 'exhausted':
                navigator.vibrate(200); // Long pulse for low battery
                break;
            case 'suggestion':
                navigator.vibrate(50); // Subtle tap for new suggestion
                break;
            default:
                navigator.vibrate(50);
        }
    }, []);

    // Core Logic: Process Text
    const processText = useCallback((text) => {
        const speakerHint = detectSpeakerHint(text, currentSpeaker);
        const timeSinceLastSuggestion = Date.now() - lastSuggestionTimeRef.current;
        const timeSinceManualToggle = Date.now() - lastManualToggleRef.current;
        const isManualLockActive = timeSinceManualToggle < 3000;

        // Auto-speaker detection logic
        if (speakerHint && !isManualLockActive) {
            speakerConfidenceRef.current[speakerHint] += text.length > 20 ? 2 : 1;
            if (speakerConfidenceRef.current[speakerHint] >= 2) {
                if (speakerHint !== currentSpeaker) setCurrentSpeaker(speakerHint);
                speakerConfidenceRef.current = { me: 0, them: 0 };
            }
        } else if (!isManualLockActive) {
            speakerConfidenceRef.current.me = Math.max(0, speakerConfidenceRef.current.me - 0.5);
            speakerConfidenceRef.current.them = Math.max(0, speakerConfidenceRef.current.them - 0.5);
        }

        if (currentSpeaker === 'them' && !isManualLockActive && timeSinceLastSuggestion < 10000 && timeSinceLastSuggestion > 500) {
            if (/^(i |my |that's )/i.test(text)) {
                setCurrentSpeaker('me');
                speakerConfidenceRef.current = { me: 0, them: 0 };
            }
        }

        // Intent and Suggestion logic
        const normalizedText = text.toLowerCase().trim();
        const fastLookupResult = fastLookupMap.get(normalizedText);

        let intent, needsSuggestion;
        if (fastLookupResult) {
            intent = fastLookupResult.intent;
            needsSuggestion = true;
            setSuggestion(fastLookupResult.suggestion);
            triggerSocialVibration('suggestion');
            lastSuggestionTimeRef.current = Date.now();
            setIsProcessing(false);
        } else {
            intent = detectIntent(text);
            needsSuggestion = shouldGenerateSuggestion(text);
            setDetectedIntent(intent);

            // Haptic alert for conflict detection
            if (intent === 'conflict') {
                triggerSocialVibration('conflict');
            }

            const precomputed = getPrecomputedSuggestion(text);
            if (precomputed) {
                setSuggestion(precomputed.suggestion);
                triggerSocialVibration('suggestion');
                lastSuggestionTimeRef.current = Date.now();
                setIsProcessing(false);
            }
        }

        // Battery and History
        const currentBattery = deduct(text, intent, persona);
        
        // Haptic alert for low battery
        if (currentBattery < AppConfig.minBatteryThreshold && battery >= AppConfig.minBatteryThreshold) {
            triggerSocialVibration('exhausted');
        }

        intentHistory.current.push({ intent, timestamp: Date.now() });
        if (intentHistory.current.length > 5) intentHistory.current.shift();

        addEntry(text, currentSpeaker, intent);
        nudgeSpeaker();

        const speakerLabel = currentSpeaker === 'me' ? 'Me' : 'Them';
        messagesRef.current.push({ role: 'user', content: `${speakerLabel}: ${text}` });
        if (messagesRef.current.length > 10) messagesRef.current.shift();

        // LLM Triggering
        const batteryThreshold = AppConfig.fatigueFilterThreshold;
        const isLowBattery = currentBattery < batteryThreshold;
        const shouldShowSuggestion = needsSuggestion && (!isLowBattery || (isLowBattery && Math.random() < currentBattery / 100));

        if (!shouldShowSuggestion || currentSpeaker === 'me' || fastLookupResult || getPrecomputedSuggestion(text)) {
            if (currentSpeaker === 'me') setSuggestion('');
            return;
        }

        // Cache check
        const recentIntents = intentHistory.current
            .filter(item => Date.now() - item.timestamp < 30000)
            .map(item => item.intent)
            .slice(-3)
            .join('_');

        const cacheKey = `${intent}_${recentIntents}_${persona}_${currentBattery > AppConfig.minBatteryThreshold ? 'normal' : 'exhausted'}`;
        const cachedSuggestion = suggestionCache.current.get(cacheKey);

        if (cachedSuggestion && Date.now() - cachedSuggestion.timestamp < 45000) {
            setSuggestion(cachedSuggestion.text);
            lastSuggestionTimeRef.current = Date.now();
            return;
        }

        // Trigger LLM
        setSuggestion(BRIDGE_PHRASES[intent] || BRIDGE_PHRASES.general);
        setIsProcessing(true);
        const personaConfig = AppConfig.personas[persona];
        
        const contextData = {
            intent: intent.toUpperCase(),
            battery: Math.round(currentBattery),
            persona: personaConfig.label,
            isExhausted: currentBattery < AppConfig.minBatteryThreshold,
            recentIntents
        };

        const instruction = contextData.isExhausted
            ? "URGENT: User is exhausted. Suggest a polite exit or minimal energy response."
            : personaConfig.prompt;

        runLLM({
            messages: [...messagesRef.current],
            context: contextData,
            instruction
        }, 4000, (tid) => {
            if (isProcessing) {
                const fallbackActions = QUICK_ACTIONS[intent] || QUICK_ACTIONS.social;
                const randomAction = fallbackActions[Math.floor(Math.random() * fallbackActions.length)];
                setSuggestion(randomAction.text);
                setIsProcessing(false);
            }
        });
    }, [persona, deduct, addEntry, currentSpeaker, setCurrentSpeaker, nudgeSpeaker, isProcessing, fastLookupMap, runLLM]);

    // UI Actions
    const toggleSpeaker = useCallback(() => {
        lastManualToggleRef.current = Date.now();
        speakerConfidenceRef.current = { me: 0, them: 0 };
        baseToggleSpeaker();
    }, [baseToggleSpeaker]);

    const summarizeSession = useCallback(() => {
        if (transcript.length === 0) return;
        setIsSummarizing(true);
        setSummaryError(null);
        runSummarize({
            transcript,
            stats: {
                totalCount: transcript.length,
                meCount: transcript.filter(t => t.speaker === 'me').length,
                themCount: transcript.filter(t => t.speaker === 'them').length,
                totalDrain: Math.round(initialBatteryRef.current - battery)
            }
        });
    }, [transcript, battery, runSummarize]);

    const startNewSession = useCallback(() => {
        setSessionSummary(null);
        setSummaryError(null);
        clearTranscript();
        resetBattery();
        messagesRef.current = [];
        initialBatteryRef.current = 100;
        resetAudio();
    }, [clearTranscript, resetBattery, resetAudio]);

    const refreshSuggestion = useCallback(() => {
        if (isProcessing) return;
        const intent = detectedIntent;
        const personaConfig = AppConfig.personas[persona];
        
        setIsProcessing(true);
        setSuggestion(BRIDGE_PHRASES[intent] || BRIDGE_PHRASES.general);

        runLLM({
            messages: [...messagesRef.current],
            context: {
                intent: intent.toUpperCase(),
                battery: Math.round(battery),
                persona: personaConfig.label,
                isExhausted: battery < AppConfig.minBatteryThreshold,
                recentIntents: intentHistory.current.slice(-3).map(i => i.intent).join('_')
            },
            instruction: personaConfig.prompt,
            retry: true
        });
    }, [detectedIntent, battery, persona, isProcessing, runLLM]);

    // Helpers
    const getDetailedModelLoadStatus = () => {
        if (!sttReady && !llmReady) {
            return `Loading AI models (${Math.round((sttProgress + llmProgress) / 2)}%)... STT: ${sttStage}, LLM: ${llmStage}`;
        }
        if (!sttReady) return `Loading speech-to-text model (${Math.round(sttProgress)}%) - ${sttStage}`;
        if (!llmReady) return `Loading language model (${Math.round(llmProgress)}%) - ${llmStage}`;
        return 'Ready';
    };

    // Effects
    useEffect(() => {
        if (initialState) {
            if (initialState.battery !== undefined) setBattery(initialState.battery);
            if (initialState.transcript) setTranscript(initialState.transcript);
            if (initialState.persona) setPersona(initialState.persona);
        }
    }, [initialState]);

    const isReady = sttReady && llmReady;
    const status = !isReady ? getDetailedModelLoadStatus() : isProcessing ? 'Processing...' : 'Ready';

    const progressiveReadiness = useMemo(() => {
        if (sttReady && llmReady) return 'full';
        if (sttReady) return 'partial';
        return 'loading';
    }, [sttReady, llmReady]);

    return {
        status, progress: (sttProgress + llmProgress) / 2, sttProgress, llmProgress, transcript, suggestion, detectedIntent,
        persona, setPersona, isReady, battery, resetBattery,
        dismissSuggestion: () => setSuggestion(''), refreshSuggestion, processAudio,
        isProcessing, currentSpeaker, toggleSpeaker, shouldPulse, consecutiveCount,
        sensitivity, setSensitivity, isPaused, togglePause,
        recharge, isExhausted, lastDrain,
        summarizeSession, startNewSession, closeSummary: () => { setSessionSummary(null); setIsSummarizing(false); },
        sessionSummary, isSummarizing, summaryError,
        initialBattery: initialBatteryRef.current,
        progressiveReadiness,
        sttStage, llmStage
    };
};
