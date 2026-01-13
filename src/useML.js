import { useState, useEffect, useRef, useCallback } from 'react';
import { detectIntent } from './core/intentEngine';
import { AppConfig } from './core/config';

export const useML = () => {
    const [status, setStatus] = useState('Idle');
    const [progress, setProgress] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [detectedIntent, setDetectedIntent] = useState('general');
    const [persona, setPersona] = useState(AppConfig.defaultPersona);
    const [isReady, setIsReady] = useState(false);
    const [battery, setBattery] = useState(100);
    
    const workerRef = useRef(null);
    const messagesRef = useRef([]);
    const handleNewTextRef = useRef(null);
    const batteryRef = useRef(battery);

    useEffect(() => { batteryRef.current = battery; }, [battery]);

    const handleNewTextStable = useCallback((text) => {
        const intent = detectIntent(text);
        setDetectedIntent(intent);
        
        const wordCount = text.trim().split(/\s+/).length;
        const deduction = Math.min(15, Math.max(2, wordCount * AppConfig.batteryDeductionRate));
        
        setBattery(prev => {
            const newVal = Math.max(0, prev - deduction);
            batteryRef.current = newVal;
            return newVal;
        });

        messagesRef.current.push({ role: 'user', content: text });
        if (messagesRef.current.length > 10) messagesRef.current.shift();

        let personaPrompt = AppConfig.personas[persona].prompt;
        const contextInjection = `\n[Context: Intent=${intent.toUpperCase()}, Battery=${Math.round(batteryRef.current)}%]`;
        
        if (batteryRef.current < AppConfig.minBatteryThreshold) {
            personaPrompt = "The user is socially exhausted. Suggest a polite exit strategy or a very brief, low-energy response. Keep it under 10 words.";
        }

        if (workerRef.current) {
            workerRef.current.postMessage({
                type: 'llm',
                data: {
                    messages: [...messagesRef.current],
                    personaPrompt: personaPrompt + contextInjection
                }
            });
        }
    }, [persona]);

    const resetBattery = useCallback(() => setBattery(100), []);
    const dismissSuggestion = useCallback(() => setSuggestion(''), []);

    useEffect(() => {
        handleNewTextRef.current = handleNewTextStable;
    }, [handleNewTextStable]);

    useEffect(() => {
        workerRef.current = new Worker(new URL('./core/worker.js', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (event) => {
            const { type, text, suggestion: sug, progress: prog, status: stat, error } = event.data;

            switch (type) {
                case 'status': setStatus(stat); break;
                case 'progress': setProgress(prog); break;
                case 'ready':
                    setStatus('Ready');
                    setIsReady(true);
                    setProgress(100);
                    break;
                case 'stt_result':
                    if (text) {
                        setTranscript(prev => prev ? prev + ' ' + text : text);
                        if (handleNewTextRef.current) handleNewTextRef.current(text);
                    }
                    break;
                case 'llm_result':
                    setSuggestion(sug);
                    break;
                case 'error':
                    console.error('Worker error:', error);
                    setStatus('Error');
                    break;
            }
        };

        workerRef.current.postMessage({ type: 'load' });

        return () => {
            if (workerRef.current) workerRef.current.terminate();
        };
    }, []);

    const processAudio = useCallback((audioData) => {
        if (!isReady || !workerRef.current) return;
        workerRef.current.postMessage({ type: 'stt', data: audioData });
    }, [isReady]);

    return {
        status, progress, transcript, suggestion, detectedIntent, 
        persona, setPersona, isReady, battery, resetBattery, 
        dismissSuggestion, processAudio
    };
};
