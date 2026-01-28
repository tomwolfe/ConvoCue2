import { useState, useEffect, useRef, useCallback } from 'react';

const LOAD_TIMEOUT = 15000; // 15 seconds

export const useWorkerManager = (onSttResult, onLlmResult, onSummaryResult, onError) => {
    const [sttReady, setSttReady] = useState(false);
    const [llmReady, setLlmReady] = useState(false);
    const [sttProgress, setSttProgress] = useState(0);
    const [llmProgress, setLlmProgress] = useState(0);
    const [sttStage, setSttStage] = useState('initializing');
    const [llmStage, setLlmStage] = useState('initializing');
    const [isHeuristicMode, setIsHeuristicMode] = useState(false);
    
    const sttWorkerRef = useRef(null);
    const llmWorkerRef = useRef(null);
    const lastTaskId = useRef(0);
    const loadTimerRef = useRef(null);

    const postToStt = useCallback((message, transfer) => {
        if (sttWorkerRef.current) {
            sttWorkerRef.current.postMessage(message, transfer);
        }
    }, []);

    const postToLlm = useCallback((message) => {
        if (llmWorkerRef.current) {
            const taskId = ++lastTaskId.current;
            llmWorkerRef.current.postMessage({ ...message, taskId });
            return taskId;
        }
        return null;
    }, []);

    useEffect(() => {
        const sttWorker = new Worker(new URL('../core/sttWorker.js', import.meta.url), { type: 'module' });
        const llmWorker = new Worker(new URL('../core/llmWorker.js', import.meta.url), { type: 'module' });
        sttWorkerRef.current = sttWorker;
        llmWorkerRef.current = llmWorker;

        // Start timeout timer
        loadTimerRef.current = setTimeout(() => {
            if (!llmReady) {
                console.warn('Model loading timed out. Switching to Heuristic Mode.');
                setIsHeuristicMode(true);
            }
        }, LOAD_TIMEOUT);

        sttWorker.onmessage = (event) => {
            const { type, text, progress, error, loadTime, stage } = event.data;
            switch (type) {
                case 'progress':
                    setSttProgress(progress);
                    if (stage) setSttStage(stage);
                    break;
                case 'ready':
                    setSttReady(true);
                    break;
                case 'stt_result':
                    if (onSttResult) onSttResult(text);
                    break;
                case 'error':
                    console.error('STT Worker error:', error);
                    if (onError) onError('stt', error);
                    break;
            }
        };

        llmWorker.onmessage = (event) => {
            const { type, suggestion, summary, progress, error, taskId, stage } = event.data;
            
            // Ignore messages from older tasks
            if (taskId && taskId < lastTaskId.current && (type === 'llm_result' || type === 'summary_result' || type === 'error')) return;

            switch (type) {
                case 'progress':
                    setLlmProgress(progress);
                    if (stage) setLlmStage(stage);
                    break;
                case 'ready':
                    setLlmReady(true);
                    if (loadTimerRef.current) {
                        clearTimeout(loadTimerRef.current);
                        loadTimerRef.current = null;
                    }
                    break;
                case 'llm_result':
                    if (onLlmResult) onLlmResult(suggestion, taskId);
                    break;
                case 'summary_result':
                    if (onSummaryResult) onSummaryResult(summary);
                    break;
                case 'error':
                    console.error('LLM Worker error:', error);
                    if (onError) onError('llm', error, taskId);
                    break;
            }
        };

        sttWorker.postMessage({ type: 'load' });
        llmWorker.postMessage({ type: 'load' });

        return () => {
            sttWorker.terminate();
            llmWorker.terminate();
            if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
        };
    }, []); // Run once on mount

    return {
        sttReady,
        llmReady,
        sttProgress,
        llmProgress,
        sttStage,
        llmStage,
        isHeuristicMode,
        postToStt,
        postToLlm,
        lastTaskId: lastTaskId.current
    };
};
