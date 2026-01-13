import React from 'react';
import { Sparkles, MessageSquare, AlertCircle, Briefcase, Heart, X, Loader2 } from 'lucide-react';

const INTENT_UI = {
    social: { icon: <MessageSquare size={14} />, color: '#3b82f6', label: 'Social' },
    professional: { icon: <Briefcase size={14} />, color: '#10b981', label: 'Professional' },
    conflict: { icon: <AlertCircle size={14} />, color: '#ef4444', label: 'Conflict' },
    empathy: { icon: <Heart size={14} />, color: '#ec4899', label: 'Empathy' },
    general: { icon: <Sparkles size={14} />, color: '#8b5cf6', label: 'General' }
};

const SuggestionHUD = ({ suggestion, intent, onDismiss, isProcessing }) => {
    const ui = INTENT_UI[intent] || INTENT_UI.general;

    if (isProcessing && !suggestion) return (
        <div className="suggestion-hud processing">
            <div className="intent-badge" style={{ backgroundColor: ui.color, opacity: 0.7 }}>
                <Loader2 size={12} className="animate-spin" />
                <span>Analyzing Cues...</span>
            </div>
            <div className="suggestion-box" style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '1rem' }}>
                Orchestrating persona response...
            </div>
        </div>
    );

    if (!suggestion) return (
        <div className="suggestion-hud empty">
            <div className="intent-badge" style={{ backgroundColor: '#64748b', opacity: 0.5 }}>
                <Sparkles size={12} />
                <span>Ready</span>
            </div>
            <div className="suggestion-box" style={{ opacity: 0.3, fontSize: '0.9rem' }}>
                Suggestions will appear here based on your conversation.
            </div>
        </div>
    );

    return (
        <div className="suggestion-hud">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="intent-badge" style={{ backgroundColor: ui.color, marginBottom: 0 }}>
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : ui.icon}
                    <span>{ui.label} {isProcessing && '(Updating...)'}</span>
                </div>
                <button 
                    onClick={onDismiss}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="suggestion-box">
                {suggestion}
            </div>
        </div>
    );
};

export default SuggestionHUD;