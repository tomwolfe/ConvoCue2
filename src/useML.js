import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { detectIntent, shouldGenerateSuggestion, getPrecomputedSuggestion, detectTurnTake } from './core/intentEngine';
import { AppConfig, BRIDGE_PHRASES, QUICK_ACTIONS } from './core/config';
import { useSocialBattery } from './hooks/useSocialBattery';
import { useTranscript } from './hooks/useTranscript';
import { SpeakerDetector } from './core/speakerDetector';
import { useWorkerManager } from './hooks/useWorkerManager';

export const useML = (initialState = null) => {
    const [suggestion, setSuggestion] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [detectedIntent, setDetectedIntent] = useState('general');
    const [persona, setPersona] = useState(AppConfig.defaultPersona);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    const {
        battery, deduct, reset: resetBattery, setBattery,
        sensitivity, setSensitivity, isPaused, togglePause, recharge, isExhausted, lastDrain
    } = useSocialBattery();
    
    const {
        transcript, addEntry, currentSpeaker, setCurrentSpeaker, toggleSpeaker: baseToggleSpeaker, clearTranscript,
        shouldPulse, nudgeSpeaker, consecutiveCount, setTranscript
    } = useTranscript();

    const speakerDetector = useMemo(() => new SpeakerDetector(), []);
    const llmTimeoutsRef = useRef(new Map());
    const suggestionCache = useRef(new Map());
    const intentHistory = useRef([]);
    const audioBufferRef = useRef([]);
    const flushTimeoutRef = useRef(null);
    const initialBatteryRef = useRef(100);

    const toggleSpeaker = useCallback(() => {
        speakerDetector.recordManualToggle();
        baseToggleSpeaker();
    }, [baseToggleSpeaker, speakerDetector]);

    // Haptic Feedback
    const triggerSocialVibration = useCallback((type) => {
        if (!('vibrate' in navigator)) return;
        switch (type) {
            case 'conflict': navigator.vibrate([100, 50, 100]); break;
            case 'exhausted': navigator.vibrate(200); break;
            case 'suggestion': navigator.vibrate(50); break;
            default: navigator.vibrate(50);
        }
    }, []);

    const handleLlmResult = useCallback((sug, taskId) => {
        if (taskId && llmTimeoutsRef.current.has(taskId)) {
            clearTimeout(llmTimeoutsRef.current.get(taskId));
            llmTimeoutsRef.current.delete(taskId);
        }

        const intent = detectedIntent;
        const recentIntents = intentHistory.current
            .filter(item => Date.now() - item.timestamp < 30000)
            .map(item => item.intent)
            .slice(-3)
            .join('_');

        const cacheKey = `${intent}_${recentIntents}_${persona}_${battery > AppConfig.minBatteryThreshold ? 'normal' : 'exhausted'}`;
        suggestionCache.current.set(cacheKey, { text: sug, timestamp: Date.now() });

        setSuggestion(sug);
        speakerDetector.recordSuggestionShown();
        setIsProcessing(false);
    }, [detectedIntent, persona, battery, speakerDetector]);

    const handleSummaryResult = useCallback((summary) => {
        setSessionSummary(summary);
        setIsSummarizing(false);
        setSummaryError(null);
    }, []);

    const handleWorkerError = useCallback((source, error, taskId) => {
        if (taskId && llmTimeoutsRef.current.has(taskId)) {
            clearTimeout(llmTimeoutsRef.current.get(taskId));
            llmTimeoutsRef.current.delete(taskId);
        }
        console.error(`${source.toUpperCase()} Worker error:`, error);
        setIsProcessing(false);
        setIsSummarizing(false);
        if (source === 'llm') setSummaryError(error);
    }, []);

    const processText = useCallback((text) => {
        // Speaker Detection
        const detected = speakerDetector.detectFromText(text, currentSpeaker);
        if (detected && detected !== currentSpeaker) {
            setCurrentSpeaker(detected);
        }

        const normalizedText = text.toLowerCase().trim();
        let intent = detectIntent(text);
        let needsSuggestion = shouldGenerateSuggestion(text);
        
        setDetectedIntent(intent);
        if (intent === 'conflict') triggerSocialVibration('conflict');

        intentHistory.current.push({ intent, timestamp: Date.now() });
        if (intentHistory.current.length > 5) intentHistory.current.shift();

        // Heuristic Suggestion Check
        const precomputed = getPrecomputedSuggestion(text);
        if (precomputed) {
            setSuggestion(precomputed.suggestion);
            triggerSocialVibration('suggestion');
            speakerDetector.recordSuggestionShown();
            setIsProcessing(false);
            // If we have a precomputed suggestion, we don't NEED the LLM, but we'll continue with other logic
            needsSuggestion = false; 
        }

        const currentBattery = deduct(text, intent, persona);
        if (currentBattery < AppConfig.minBatteryThreshold && battery >= AppConfig.minBatteryThreshold) {
            triggerSocialVibration('exhausted');
        }

        addEntry(text, currentSpeaker, intent);
        nudgeSpeaker();

        if (detectTurnTake(text)) {
            setTimeout(nudgeSpeaker, 500);
        }

        // Suggestion Filtering
        const batteryThreshold = AppConfig.fatigueFilterThreshold;
        const isLowBattery = currentBattery < batteryThreshold;
        const shouldShowSuggestion = needsSuggestion &&
            (!isLowBattery || (isLowBattery && Math.random() < currentBattery / 100));

        if (!shouldShowSuggestion || currentSpeaker === 'me' || isHeuristicMode) {
            setIsProcessing(false);
            if (currentSpeaker === 'me') setSuggestion('');
            return;
        }

        // Cache Check
        const recentIntents = intentHistory.current
            .filter(item => Date.now() - item.timestamp < 30000)
            .map(item => item.intent)
            .slice(-3)
            .join('_');
        const cacheKey = `${intent}_${recentIntents}_${persona}_${currentBattery > AppConfig.minBatteryThreshold ? 'normal' : 'exhausted'}`;
        const cached = suggestionCache.current.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 45000) {
            setSuggestion(cached.text);
            speakerDetector.recordSuggestionShown();
            setIsProcessing(false);
            return;
        }

        // LLM Request
        setSuggestion(BRIDGE_PHRASES[intent] || BRIDGE_PHRASES.general);
        setIsProcessing(true);
        const personaConfig = AppConfig.personas[persona];
        
        // Enhance context with shortTermMemory (last 3 entries)
        const shortTermMemory = transcript.slice(-3).map(t => `${t.speaker}: ${t.text}`).join(' | ');

        const contextData = {
            intent: intent.toUpperCase(),
            battery: Math.round(currentBattery),
            persona: personaConfig.label,
            isExhausted: currentBattery < AppConfig.minBatteryThreshold,
            recentIntents: recentIntents,
            shortTermMemory // Added to payload
        };

        const instruction = contextData.isExhausted
            ? "URGENT: User is exhausted. Suggest a polite exit or minimal energy response."
            : personaConfig.prompt;

        const taskId = postToLlm({
            type: 'llm',
            data: {
                messages: transcript.slice(-6).map(t => ({ role: 'user', content: `${t.speaker}: ${t.text}` })),
                context: contextData,
                instruction: instruction
            }
        });

        if (taskId) {
            const timeoutId = setTimeout(() => {
                if (isProcessing && (suggestion === BRIDGE_PHRASES[intent] || suggestion === BRIDGE_PHRASES.general)) {
                    const fallbackActions = QUICK_ACTIONS[intent] || QUICK_ACTIONS.social;
                    const randomAction = fallbackActions[Math.floor(Math.random() * fallbackActions.length)];
                    setSuggestion(randomAction.text);
                    setIsProcessing(false);
                }
            }, 4000);
            llmTimeoutsRef.current.set(taskId, timeoutId);
        }
    }, [persona, deduct, addEntry, currentSpeaker, nudgeSpeaker, suggestion, isProcessing, isHeuristicMode, transcript, postToLlm, triggerSocialVibration, speakerDetector, battery]);

    const {
        sttReady, llmReady, sttProgress, llmProgress, sttStage, llmStage, isHeuristicMode,
        postToStt, postToLlm
    } = useWorkerManager(processText, handleLlmResult, handleSummaryResult, handleWorkerError);

    const flushAudioBuffer = useCallback(() => {
        if (audioBufferRef.current.length === 0) return;
        const totalLength = audioBufferRef.current.reduce((acc, curr) => acc + curr.length, 0);
        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const buffer of audioBufferRef.current) {
            combined.set(buffer, offset);
            offset += buffer.length;
        }
        postToStt({ type: 'stt', data: combined }, [combined.buffer]);
        audioBufferRef.current = [];
        if (flushTimeoutRef.current) {
            clearTimeout(flushTimeoutRef.current);
            flushTimeoutRef.current = null;
        }
    }, [postToStt]);

    const processAudio = useCallback((audioData) => {
        if (!sttReady) return;

        const detected = speakerDetector.detectFromVolume(audioData, currentSpeaker);
        if (detected && detected !== currentSpeaker) {
            setCurrentSpeaker(detected);
        }

        audioBufferRef.current.push(audioData);
        if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);

        const totalLength = audioBufferRef.current.reduce((acc, curr) => acc + curr.length, 0);
        if (totalLength > 48000) {
            flushAudioBuffer();
        } else {
            flushTimeoutRef.current = setTimeout(flushAudioBuffer, 300);
        }
    }, [sttReady, flushAudioBuffer, currentSpeaker, setCurrentSpeaker, speakerDetector]);

    const summarizeSession = useCallback(() => {
        if (isHeuristicMode || transcript.length === 0) return;
        setIsSummarizing(true);
        setSummaryError(null);
        const stats = {
            totalCount: transcript.length,
            meCount: transcript.filter(t => t.speaker === 'me').length,
            themCount: transcript.filter(t => t.speaker === 'them').length,
            totalDrain: Math.round(initialBatteryRef.current - battery)
        };
        postToLlm({
            type: 'summarize',
            data: { transcript, stats }
        });
    }, [transcript, battery, isHeuristicMode, postToLlm]);

    const startNewSession = useCallback(() => {
        setSessionSummary(null);
        setSummaryError(null);
        clearTranscript();
        resetBattery();
        initialBatteryRef.current = 100;
        audioBufferRef.current = [];
        if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    }, [clearTranscript, resetBattery]);

    const refreshSuggestion = useCallback(() => {
        if (isHeuristicMode || isProcessing) return;
        // Reuse logic from processText but with retry: true
        // For simplicity in this refactor, we just trigger the LLM call again if possible
        // but here we just follow the original pattern
        const intent = detectedIntent;
        const personaConfig = AppConfig.personas[persona];
        setIsProcessing(true);
        setSuggestion(BRIDGE_PHRASES[intent] || BRIDGE_PHRASES.general);

        const recentIntents = intentHistory.current
            .filter(item => Date.now() - item.timestamp < 30000)
            .map(item => item.intent)
            .slice(-3)
            .join('_');

        const shortTermMemory = transcript.slice(-3).map(t => `${t.speaker}: ${t.text}`).join(' | ');

        const taskId = postToLlm({
            type: 'llm',
            data: {
                messages: transcript.slice(-6).map(t => ({ role: 'user', content: `${t.speaker}: ${t.text}` })),
                context: {
                    intent: intent.toUpperCase(),
                    battery: Math.round(battery),
                    persona: personaConfig.label,
                    isExhausted: battery < AppConfig.minBatteryThreshold,
                    recentIntents,
                    shortTermMemory
                },
                instruction: personaConfig.prompt,
                retry: true
            }
        });

        if (taskId) {
            const timeoutId = setTimeout(() => {
                if (isProcessing) setSuggestion(`Refreshing ${intent} suggestions...`);
            }, 2000);
            llmTimeoutsRef.current.set(taskId, timeoutId);
        }
    }, [detectedIntent, battery, persona, isProcessing, isHeuristicMode, transcript, postToLlm]);

    const dismissSuggestion = useCallback(() => {
        setSuggestion('');
        setIsProcessing(false);
    }, []);

    // Status logic
    const status = useMemo(() => {
        if (isHeuristicMode && !llmReady) return 'Heuristic Mode (Models Slow/Offline)';
        if (!sttReady || !llmReady) {
            const progress = Math.round((sttProgress + llmProgress) / 2);
            return `Loading AI models (${progress}%)...`;
        }
        return isProcessing ? 'Processing...' : 'Ready';
    }, [sttReady, llmReady, sttProgress, llmProgress, isProcessing, isHeuristicMode]);

    const isReady = sttReady && (llmReady || isHeuristicMode);
    const progressiveReadiness = sttReady && llmReady ? 'full' : sttReady ? 'partial' : 'loading';

    return {
        status, progress: (sttProgress + llmProgress) / 2, sttProgress, llmProgress, transcript, suggestion, detectedIntent,
        persona, setPersona, isReady, battery, resetBattery,
        dismissSuggestion, refreshSuggestion, processAudio, isProcessing,
        currentSpeaker, toggleSpeaker, shouldPulse, consecutiveCount,
        sensitivity, setSensitivity, isPaused, togglePause,
        recharge, isExhausted, lastDrain,
        summarizeSession, startNewSession, closeSummary: () => setSessionSummary(null), 
        sessionSummary, isSummarizing, summaryError,
        initialBattery: initialBatteryRef.current,
        sttStage, llmStage, isHeuristicMode, progressiveReadiness
    };
};
