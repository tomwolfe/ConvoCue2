import { useState, useEffect } from 'react';

export const useSessionHistory = () => {
    const [sessions, setSessions] = useState([]);
    
    // Load sessions from localStorage on initialization
    useEffect(() => {
        const savedSessions = localStorage.getItem('convocue_sessions');
        if (savedSessions) {
            try {
                const parsedSessions = JSON.parse(savedSessions);
                // Sort by most recent first
                setSessions(parsedSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            } catch (error) {
                console.error('Error parsing session history:', error);
                setSessions([]);
            }
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('convocue_sessions', JSON.stringify(sessions));
    }, [sessions]);

    const saveSession = (transcript, battery, initialBattery, stats) => {
        const newSession = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            transcript,
            battery,
            initialBattery,
            stats,
            duration: transcript.length > 0 ? 
                new Date(transcript[transcript.length - 1].timestamp).getTime() - 
                new Date(transcript[0].timestamp).getTime() : 0
        };
        
        setSessions(prev => [newSession, ...prev]); // Add to beginning of list
    };

    const loadSession = (sessionId) => {
        const session = sessions.find(s => s.id === sessionId);
        return session || null;
    };

    const deleteSession = (sessionId) => {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
    };

    const exportSession = (sessionId) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return null;
        
        const dataStr = JSON.stringify(session, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `convocue_session_${session.timestamp}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        return true;
    };

    const exportAllSessions = () => {
        const dataStr = JSON.stringify(sessions, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `convocue_all_sessions_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        return true;
    };

    const clearAllSessions = () => {
        setSessions([]);
        localStorage.removeItem('convocue_sessions');
    };

    // Get session statistics
    const getSessionStats = () => {
        if (sessions.length === 0) return {
            totalSessions: 0,
            totalMessages: 0,
            avgDuration: 0,
            avgBatteryDrain: 0
        };

        const totalMessages = sessions.reduce((sum, session) => sum + session.transcript.length, 0);
        const avgDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length;
        const avgBatteryDrain = sessions.reduce((sum, session) => {
            return sum + (session.initialBattery - session.battery);
        }, 0) / sessions.length;

        return {
            totalSessions: sessions.length,
            totalMessages,
            avgDuration: Math.round(avgDuration / 1000), // Convert to seconds
            avgBatteryDrain: Math.round(avgBatteryDrain * 100) / 100
        };
    };

    return {
        sessions,
        saveSession,
        loadSession,
        deleteSession,
        exportSession,
        exportAllSessions,
        clearAllSessions,
        getSessionStats
    };
};