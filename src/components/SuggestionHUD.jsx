import React from 'react';
import { Sparkles, MessageSquare, AlertCircle, Briefcase, Heart, X, Loader2 } from 'lucide-react';

const INTENT_UI = {
    social: { icon: <MessageSquare size={14} />, color: '#3b82f6', label: 'Social' },
    professional: { icon: <Briefcase size={14} />, color: '#10b981', label: 'Professional' },
    conflict: { icon: <AlertCircle size={14} />, color: '#ef4444', label: 'Conflict' },
    empathy: { icon: <Heart size={14} />, color: '#ec4899', label: 'Empathy' },
    general: { icon: <Sparkles size={14} />, color: '#8b5cf6', label: 'General' }
};

const SuggestionHUD = ({ suggestion, intent, onDismiss, isProcessing, battery }) => {
    const ui = INTENT_UI[intent] || INTENT_UI.general;
    const isExhausted = battery < 20;

    return (
        <div className={`suggestion-hud ${isExhausted ? 'exhausted' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="intent-badge" style={{ backgroundColor: ui.color, marginBottom: 0 }}>
                        {isProcessing ? <Loader2 size={12} className="animate-spin" /> : ui.icon}
                        <span>{ui.label} {isProcessing && '(Updating...)'}</span>
                    </div>
                    {isExhausted && (
                        <div className="intent-badge exhausted-badge">
                            <AlertCircle size={12} />
                            <span>Exhausted Mode</span>
                        </div>
                    )}
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
                {suggestion || (isProcessing ? "Orchestrating persona response..." : "Suggestions will appear here based on your conversation.")}
            </div>
        </div>
    );
};

export default SuggestionHUD;