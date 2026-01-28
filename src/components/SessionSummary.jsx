import React from 'react';
import { BarChart2, MessageSquare, Battery, Zap, RefreshCw, X } from 'lucide-react';

const SessionSummary = ({ summary, transcript, battery, initialBattery, onNewSession, error, onRetry, onClose }) => {
    const stats = {
        totalMessages: transcript.length,
        myMessages: transcript.filter(t => t.speaker === 'me').length,
        theirMessages: transcript.filter(t => t.speaker === 'them').length,
        drain: Math.max(0, Math.round(initialBattery - battery))
    };

    const formatSummary = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.match(/^[1-3]\./) || trimmed.startsWith('**')) {
                const parts = trimmed.split(':');
                if (parts.length > 1) {
                    return <p key={i} className="summary-point"><strong>{parts[0].replace(/\*\*/g, '')}</strong>: {parts.slice(1).join(':')}</p>;
                }
            }
            return <p key={i}>{trimmed}</p>;
        }).filter(p => p !== null);
    };

    const generateSocialChallenge = (stats) => {
        const myTalkRatio = stats.myMessages / (stats.totalMessages || 1);
        
        if (stats.totalMessages < 5) {
            return "Try to stay in the conversation longer next time. Aim for at least 10 exchanges.";
        }
        
        if (myTalkRatio > 0.7) {
            return "You dominated this session. Next time, try to ask 3 follow-up questions to balance the floor.";
        }
        
        if (myTalkRatio < 0.3) {
            return "You were a bit quiet. Challenge yourself to share 2 personal anecdotes or opinions next time.";
        }
        
        if (stats.drain > 40) {
            return "This was taxing! Next time, try using one of the 'Exit Strategy' suggestions when you hit 30% drain.";
        }
        
        return "Great balance! For the next session, try to identify the other person's primary intent earlier.";
    };

    return (
        <div className="session-summary-overlay">
            <div className="session-summary-modal">
                <div className="summary-header">
                    <h2>Session Insights</h2>
                    <button className="btn-icon" onClick={onClose} title="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="summary-stats-grid">
                    <div className="stat-card">
                        <MessageSquare size={16} />
                        <span className="stat-value">{stats.totalMessages}</span>
                        <span className="stat-label">Total Messages</span>
                    </div>
                    <div className="stat-card">
                        <Battery size={16} />
                        <span className="stat-value">-{stats.drain}%</span>
                        <span className="stat-label">Battery Used</span>
                    </div>
                    <div className="stat-card">
                        <Zap size={16} />
                        <span className="stat-value">{Math.round((stats.myMessages / (stats.totalMessages || 1)) * 100)}%</span>
                        <span className="stat-label">My Talk Time</span>
                    </div>
                </div>

                <div className="summary-content">
                    <h3>AI Reflection</h3>
                    {error ? (
                        <div className="summary-text error-text">
                            <p>Failed to generate summary: {error}</p>
                            <button className="btn-retry" onClick={onRetry}>
                                <RefreshCw size={14} /> Retry
                            </button>
                        </div>
                    ) : summary ? (
                        <>
                            <div className="summary-text">
                                {formatSummary(summary)}
                            </div>
                            
                            <div className="social-challenge-section">
                                <h3>Next Session Challenge</h3>
                                <div className="challenge-card">
                                    <Zap size={18} className="challenge-icon" />
                                    <p>{generateSocialChallenge(stats)}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="summary-loading">
                            <RefreshCw className="animate-spin" />
                            <span>Generating insights...</span>
                        </div>
                    )}
                </div>

                <div className="summary-footer">
                    <button className="btn-primary" onClick={onNewSession}>
                        <RefreshCw size={16} />
                        <span>Start New Session</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionSummary;
