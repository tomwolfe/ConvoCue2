import React, { useState } from 'react';
import { Clock, Trash2, Download, Eye, Calendar, MessageSquare, BatteryCharging, BarChart3 } from 'lucide-react';

const SessionHistoryModal = ({ sessions, onLoadSession, onDeleteSession, onExportSession, onExportAll, onClose, stats }) => {
    const [selectedSession, setSelectedSession] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString();
    };

    const formatDuration = (durationMs) => {
        if (!durationMs) return 'N/A';
        const seconds = Math.floor(durationMs / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const handleLoadSession = (sessionId) => {
        onLoadSession(sessionId);
        onClose();
    };

    if (viewMode === 'detail' && selectedSession) {
        return (
            <div className="session-history-detail">
                <div className="modal-header">
                    <h3>Session Details</h3>
                    <button className="btn-icon" onClick={() => setViewMode('list')}>
                        ← Back to List
                    </button>
                </div>
                
                <div className="session-detail-content">
                    <div className="session-metadata">
                        <div className="metadata-item">
                            <Calendar size={16} />
                            <span>{formatDate(selectedSession.timestamp)}</span>
                        </div>
                        <div className="metadata-item">
                            <Clock size={16} />
                            <span>Duration: {formatDuration(selectedSession.duration)}</span>
                        </div>
                        <div className="metadata-item">
                            <MessageSquare size={16} />
                            <span>Messages: {selectedSession.transcript.length}</span>
                        </div>
                        <div className="metadata-item">
                            <BatteryCharging size={16} />
                            <span>Battery: {selectedSession.initialBattery} → {selectedSession.battery}</span>
                        </div>
                    </div>

                    <div className="session-transcript-preview">
                        <h4>Transcript Preview</h4>
                        <div className="transcript-preview-content">
                            {selectedSession.transcript.slice(0, 10).map((entry, i) => (
                                <div key={i} className={`transcript-entry ${entry.speaker}`}>
                                    <span className="speaker-icon">
                                        {entry.speaker === 'me' ? '👤' : '👥'}
                                    </span>
                                    <span className="entry-text">{entry.text}</span>
                                </div>
                            ))}
                            {selectedSession.transcript.length > 10 && (
                                <div className="more-indicator">... and {selectedSession.transcript.length - 10} more messages</div>
                            )}
                        </div>
                    </div>

                    <div className="session-actions">
                        <button
                            className="btn-primary btn-load-session"
                            onClick={() => {
                                // Call the parent's load function which will handle the state update
                                onLoadSession(selectedSession.id);
                            }}
                        >
                            <Eye size={16} />
                            Load Session
                        </button>
                        <button
                            className="btn-export"
                            onClick={() => onExportSession(selectedSession.id)}
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="session-history-modal">
            <div className="modal-header">
                <div className="modal-title-section">
                    <h3>Session History</h3>
                    <div className="session-stats">
                        <span className="stat-badge">
                            <BarChart3 size={14} />
                            {stats.totalSessions} sessions
                        </span>
                        <span className="stat-badge">
                            <MessageSquare size={14} />
                            {stats.totalMessages} messages
                        </span>
                        <span className="stat-badge">
                            <Clock size={14} />
                            {stats.avgDuration}s avg
                        </span>
                    </div>
                </div>
                <div className="modal-actions">
                    <button 
                        className="btn-export-all" 
                        onClick={onExportAll}
                        title="Export all sessions"
                    >
                        <Download size={16} />
                        Export All
                    </button>
                    <button className="btn-icon" onClick={onClose} title="Close">
                        ×
                    </button>
                </div>
            </div>

            {sessions.length === 0 ? (
                <div className="empty-history">
                    <div className="empty-icon">📅</div>
                    <h4>No Sessions Yet</h4>
                    <p>Start a conversation to save your first session</p>
                </div>
            ) : (
                <div className="sessions-list">
                    {sessions.map((session) => (
                        <div key={session.id} className="session-item">
                            <div className="session-info" onClick={() => {
                                setSelectedSession(session);
                                setViewMode('detail');
                            }}>
                                <div className="session-header">
                                    <div className="session-date">
                                        <Calendar size={14} />
                                        <span>{formatDate(session.timestamp)}</span>
                                    </div>
                                    <div className="session-duration">
                                        <Clock size={14} />
                                        <span>{formatDuration(session.duration)}</span>
                                    </div>
                                </div>
                                
                                <div className="session-stats-preview">
                                    <div className="stat-chip">
                                        <MessageSquare size={12} />
                                        <span>{session.transcript.length}</span>
                                    </div>
                                    <div className="stat-chip battery-chip">
                                        <BatteryCharging size={12} />
                                        <span>{session.initialBattery}→{session.battery}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="session-actions">
                                <button 
                                    className="btn-icon btn-view" 
                                    onClick={() => {
                                        setSelectedSession(session);
                                        setViewMode('detail');
                                    }}
                                    title="View details"
                                >
                                    <Eye size={14} />
                                </button>
                                <button 
                                    className="btn-icon btn-load" 
                                    onClick={() => handleLoadSession(session.id)}
                                    title="Load session"
                                >
                                    <BarChart3 size={14} />
                                </button>
                                <button 
                                    className="btn-icon btn-export" 
                                    onClick={() => onExportSession(session.id)}
                                    title="Export session"
                                >
                                    <Download size={14} />
                                </button>
                                <button 
                                    className="btn-icon btn-delete" 
                                    onClick={() => onDeleteSession(session.id)}
                                    title="Delete session"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="modal-footer">
                <button 
                    className="btn-danger" 
                    onClick={() => {
                        if (window.confirm('Are you sure you want to delete all sessions? This cannot be undone.')) {
                            onExportAll(); // Prompt user to export first
                        }
                    }}
                >
                    Export All & Clear History
                </button>
            </div>
        </div>
    );
};

export default SessionHistoryModal;