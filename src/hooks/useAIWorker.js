import { useState, useEffect, useRef, useCallback } from 'react';

export const useAIWorker = (onSTTResult, onLLMResult, onSummaryResult, onLLMError) => {
    const sttWorkerRef = useRef(null);
    const llmWorkerRef = useRef(null);
    const lastTaskId = useRef(0);
    const llmTimeoutsRef = useRef(new Map());

    const [sttReady, setSttReady] = useState(false);
    const [llmReady, setLlmReady] = useState(false);
    const [sttProgress, setSttProgress] = useState(0);
    const [llmProgress, setLlmProgress] = useState(0);
    const [sttStage, setSttStage] = useState('initializing');
    const [llmStage, setLlmStage] = useState('initializing');
    const [sttLoadTime, setSttLoadTime] = useState(null);
    const [llmLoadTime, setLlmLoadTime] = useState(null);

    useEffect(() => {
        const sttWorker = new Worker(new URL('../core/sttWorker.js', import.meta.url), { type: 'module' });
        const llmWorker = new Worker(new URL('../core/llmWorker.js', import.meta.url), { type: 'module' });
        sttWorkerRef.current = sttWorker;
        llmWorkerRef.current = llmWorker;

        sttWorker.onmessage = (event) => {
            const { type, text, progress, loadTime, stage, error } = event.data;
            switch (type) {
                case 'progress':
                    setSttProgress(progress);
                    if (stage) setSttStage(stage);
                    break;
                case 'ready':
                    setSttReady(true);
                    if (loadTime !== undefined) setSttLoadTime(loadTime);
                    break;
                case 'stt_result':
                    if (text && onSTTResult) onSTTResult(text);
                    break;
                case 'error':
                    console.error('STT Worker error:', error);
                    break;
            }
        };

        llmWorker.onmessage = (event) => {
            const { type, suggestion, summary, progress, error, taskId, loadTime, stage } = event.data;
            
            // Ignore results from old tasks
            if (taskId && taskId < lastTaskId.current && (type === 'llm_result' || type === 'summary_result' || type === 'error')) {
                return;
            }

            switch (type) {
                case 'progress':
                    setLlmProgress(progress);
                    if (stage) setLlmStage(stage);
                    break;
                case 'ready':
                    setLlmReady(true);
                    if (loadTime !== undefined) setLlmLoadTime(loadTime);
                    break;
                case 'llm_result':
                    if (taskId && llmTimeoutsRef.current.has(taskId)) {
                        clearTimeout(llmTimeoutsRef.current.get(taskId));
                        llmTimeoutsRef.current.delete(taskId);
                    }
                    if (onLLMResult) onLLMResult(suggestion, taskId);
                    break;
                case 'summary_result':
                    if (onSummaryResult) onSummaryResult(summary);
                    break;
                case 'error':
                    if (taskId && llmTimeoutsRef.current.has(taskId)) {
                        clearTimeout(llmTimeoutsRef.current.get(taskId));
                        llmTimeoutsRef.current.delete(taskId);
                    }
                    console.error('LLM Worker error:', error);
                    if (onLLMError) onLLMError(error);
                    break;
            }
        };

        sttWorker.postMessage({ type: 'load' });
        llmWorker.postMessage({ type: 'load' });

        return () => {
            sttWorker.terminate();
            llmWorker.terminate();
            for (const timeoutId of llmTimeoutsRef.current.values()) {
                clearTimeout(timeoutId);
            }
            llmTimeoutsRef.current.clear();
        };
    }, []);

    const runSTT = useCallback((audioData) => {
        if (sttWorkerRef.current && sttReady) {
            // Use Transferable Objects for efficiency
            sttWorkerRef.current.postMessage({ type: 'stt', data: audioData }, [audioData.buffer]);
        }
    }, [sttReady]);

    const runLLM = useCallback((data, fallbackDelay = 4000, onFallback = null) => {
        if (!llmWorkerRef.current || !llmReady) return null;

        const taskId = ++lastTaskId.current;
        
        if (onFallback) {
            const timeoutId = setTimeout(() => {
                onFallback(taskId);
            }, fallbackDelay);
            llmTimeoutsRef.current.set(taskId, timeoutId);
        }

        llmWorkerRef.current.postMessage({
            type: 'llm',
            taskId,
            data
        });

        return taskId;
    }, [llmReady]);

    const runSummarize = useCallback((data) => {
        if (!llmWorkerRef.current || !llmReady) return null;

        const taskId = ++lastTaskId.current;
        llmWorkerRef.current.postMessage({
            type: 'summarize',
            taskId,
            data
        });
        return taskId;
    }, [llmReady]);

    return {
        sttReady,
        llmReady,
        sttProgress,
        llmProgress,
        sttStage,
        llmStage,
        sttLoadTime,
        llmLoadTime,
        runSTT,
        runLLM,
        runSummarize,
        lastTaskId
    };
};
