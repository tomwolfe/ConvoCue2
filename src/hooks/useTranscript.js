import { useState, useCallback } from 'react';

export const useTranscript = () => {
    const [transcript, setTranscript] = useState([]);
    const [currentSpeaker, setCurrentSpeaker] = useState('them');
    const [shouldPulse, setShouldPulse] = useState(false);

    const nudgeSpeaker = useCallback(() => {
        setShouldPulse(true);
        setTimeout(() => setShouldPulse(false), 2000);
    }, []);

    const addEntry = useCallback((text, speaker = currentSpeaker) => {
        setTranscript(prev => [...prev, { 
            text, 
            speaker, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
    }, [currentSpeaker]);

    const toggleSpeaker = useCallback(() => {
        setCurrentSpeaker(prev => prev === 'me' ? 'them' : 'me');
    }, []);

    const clearTranscript = useCallback(() => setTranscript([]), []);

    return { transcript, addEntry, currentSpeaker, setCurrentSpeaker, toggleSpeaker, clearTranscript, shouldPulse, nudgeSpeaker };
};
