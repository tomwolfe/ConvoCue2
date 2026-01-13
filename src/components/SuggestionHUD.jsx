import React from 'react';
import { Sparkles, MessageSquare, AlertCircle, Briefcase, Heart, X } from 'lucide-react';

const INTENT_UI = {
    social: { icon: <MessageSquare size={16} />, color: '#3b82f6', label: 'Social' },
    professional: { icon: <Briefcase size={16} />, color: '#10b981', label: 'Professional' },
    conflict: { icon: <AlertCircle size={16} />, color: '#ef4444', label: 'Conflict/Challenge' },
    empathy: { icon: <Heart size={16} />, color: '#ec4899', label: 'Empathy/Support' },
    general: { icon: <Sparkles size={16} />, color: '#8b5cf6', label: 'General' }
};

const SuggestionHUD = ({ suggestion, intent, onDismiss }) => {
    const ui = INTENT_UI[intent] || INTENT_UI.general;

    if (!suggestion) return (
        <div className="suggestion-hud empty">
            <div className="suggestion-box" style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                Listening for speech cues...
            </div>
        </div>
    );

    return (
        <div className="suggestion-hud">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="intent-badge" style={{ backgroundColor: ui.color }}>
                    {ui.icon}
                    <span>{ui.label}</span>
                </div>
                <button 
                    onClick={onDismiss}
                    style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.5, cursor: 'pointer', padding: '4px' }}
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="suggestion-box">
                "{suggestion}"
            </div>
        </div>
    );
};

export default SuggestionHUD;
