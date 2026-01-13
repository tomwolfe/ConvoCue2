import React, { useState } from 'react';
import { Sparkles, MessageSquare, AlertCircle, Briefcase, Heart, X, Loader2, ClipboardCheck, Zap } from 'lucide-react';
import { QUICK_ACTIONS, AppConfig } from '../core/config';

const INTENT_UI = {
    social: { icon: <MessageSquare size={14} />, color: '#3b82f6', label: 'Social' },
    professional: { icon: <Briefcase size={14} />, color: '#10b981', label: 'Professional' },
    conflict: { icon: <AlertCircle size={14} />, color: '#ef4444', label: 'Conflict' },
    empathy: { icon: <Heart size={14} />, color: '#ec4899', label: 'Empathy' },
    general: { icon: <Sparkles size={14} />, color: '#8b5cf6', label: 'General' }
};

const SuggestionHUD = ({ suggestion, intent, onDismiss, isProcessing, battery }) => {
    const [copied, setCopied] = useState(null);
    const ui = INTENT_UI[intent] || INTENT_UI.general;
    const isExhausted = battery < AppConfig.minBatteryThreshold;

    const handleQuickAction = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopied(index);
        setTimeout(() => setCopied(null), 2000);
    };

    const actions = isExhausted 
        ? QUICK_ACTIONS.exhausted 
        : (QUICK_ACTIONS[intent] || QUICK_ACTIONS.social);

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

            <div className="quick-actions-container">
                <div className="quick-actions-label">
                    <Zap size={10} />
                    <span>Quick Responses</span>
                </div>
                <div className="quick-actions-list">
                    {actions.map((action, i) => (
                        <button 
                            key={i} 
                            className={`quick-action-btn ${copied === i ? 'copied' : ''}`}
                            onClick={() => handleQuickAction(action.text, i)}
                        >
                            {copied === i ? <ClipboardCheck size={12} /> : null}
                            <span>{copied === i ? 'Copied!' : action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SuggestionHUD;