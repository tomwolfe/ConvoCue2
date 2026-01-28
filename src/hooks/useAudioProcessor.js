import { useRef, useCallback, useEffect } from 'react';

export const useAudioProcessor = (onFlush, currentSpeaker, setCurrentSpeaker, lastManualToggleRef, speakerConfidenceRef) => {
    const audioBufferRef = useRef([]);
    const flushTimeoutRef = useRef(null);
    const meVolumeRef = useRef(0);

    const calculateVolume = (audioData) => {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    };

    const flushAudioBuffer = useCallback(() => {
        if (audioBufferRef.current.length === 0) return;
        
        const totalLength = audioBufferRef.current.reduce((acc, curr) => acc + curr.length, 0);
        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const buffer of audioBufferRef.current) {
            combined.set(buffer, offset);
            offset += buffer.length;
        }
        
        onFlush(combined);
        
        audioBufferRef.current = [];
        if (flushTimeoutRef.current) {
            clearTimeout(flushTimeoutRef.current);
            flushTimeoutRef.current = null;
        }
    }, [onFlush]);

    const processAudio = useCallback((audioData) => {
        // 80/20 Auto-Diarization: Volume-based heuristic
        const currentVolume = calculateVolume(audioData);
        const timeSinceManualToggle = Date.now() - (lastManualToggleRef?.current || 0);
        const isManualLockActive = timeSinceManualToggle < 3000;

        if (currentSpeaker === 'me') {
            // Update "Me" baseline
            meVolumeRef.current = meVolumeRef.current === 0 
                ? currentVolume 
                : meVolumeRef.current * 0.95 + currentVolume * 0.05;
        } else if (meVolumeRef.current > 0.01 && !isManualLockActive) {
            if (currentVolume > meVolumeRef.current * 0.7) {
                if (setCurrentSpeaker) {
                    setCurrentSpeaker('me');
                    if (speakerConfidenceRef) {
                        speakerConfidenceRef.current = { me: 0, them: 0 };
                    }
                }
            } else {
                meVolumeRef.current *= 0.999;
            }
        } else if (meVolumeRef.current === 0 && currentVolume > 0.05) {
            meVolumeRef.current = currentVolume;
            if (currentVolume > 0.1 && setCurrentSpeaker) {
                setCurrentSpeaker('me');
                if (speakerConfidenceRef) {
                    speakerConfidenceRef.current = { me: 0, them: 0 };
                }
            }
        }

        audioBufferRef.current.push(audioData);

        if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);

        const totalLength = audioBufferRef.current.reduce((acc, curr) => acc + curr.length, 0);
        if (totalLength > 48000) {
            flushAudioBuffer();
        } else {
            flushTimeoutRef.current = setTimeout(flushAudioBuffer, 300);
        }
    }, [currentSpeaker, setCurrentSpeaker, flushAudioBuffer]);

    useEffect(() => {
        return () => {
            if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
        };
    }, []);

    const resetAudio = useCallback(() => {
        audioBufferRef.current = [];
        if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    }, []);

    return {
        processAudio,
        resetAudio,
        meVolumeRef
    };
};
