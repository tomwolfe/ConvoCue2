import React, { useState } from 'react';
import { Sparkles, MessageSquare, AlertCircle, Briefcase, Heart, X, Loader2, ClipboardCheck, Zap, Battery } from 'lucide-react';
import { QUICK_ACTIONS, AppConfig } from '../core/config';

const INTENT_UI = {
    social: { icon: <MessageSquare size={14} />, color: '#3b82f6', label: 'Social' },
    professional: { icon: <Briefcase size={14} />, color: '#10b981', label: 'Professional' },
    conflict: { icon: <AlertCircle size={14} />, color: '#ef4444', label: 'Conflict' },
    empathy: { icon: <Heart size={14} />, color: '#ec4899', label: 'Empathy' },
    positive: { icon: <Sparkles size={14} />, color: '#f59e0b', label: 'Positive' },
    general: { icon: <Sparkles size={14} />, color: '#8b5cf6', label: 'General' }
};

const SuggestionHUD = ({ suggestion, intent, onDismiss, isProcessing, battery, isExhausted }) => {
    const [copied, setCopied] = useState(null);
    const ui = INTENT_UI[intent] || INTENT_UI.general;

    const handleQuickAction = (text, index) => {
        if (!navigator.clipboard) {
            console.error('Clipboard API not available');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            setCopied(index);
            setTimeout(() => setCopied(null), 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    const actions = isExhausted
        ? QUICK_ACTIONS.exhausted
        : (QUICK_ACTIONS[intent] || QUICK_ACTIONS.social);

    return (
        <div className={`suggestion-hud ${isExhausted ? 'exhausted' : ''}`} role="region" aria-label="Suggestion HUD">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="intent-badge" style={{ backgroundColor: ui.color, marginBottom: 0 }} aria-label={`Intent: ${ui.label}`}>
                        {isProcessing ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : ui.icon}
                        <span>{ui.label} {isProcessing && '(Updating...)'}</span>
                    </div>
                    {battery < 30 && !isExhausted && (
                        <div className="intent-badge" style={{ backgroundColor: '#f59e0b', marginBottom: 0 }} aria-label="Low Battery">
                            <Battery size={12} aria-hidden="true" />
                            <span>Low Battery</span>
                        </div>
                    )}
                    {battery < 20 && !isExhausted && (
                        <div className="intent-badge battery-critical-badge" aria-label="Critical Battery">
                            <AlertCircle size={12} aria-hidden="true" />
                            <span>Critical Battery</span>
                        </div>
                    )}
                    {isExhausted && (
                        <div className="intent-badge exhausted-badge" aria-label="Exhausted Mode">
                            <AlertCircle size={12} aria-hidden="true" />
                            <span>Exhausted Mode</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={onDismiss}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title="Dismiss"
                    aria-label="Dismiss suggestion"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onDismiss();
                        }
                    }}
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>

            <div className={`suggestion-box ${isProcessing ? 'is-processing' : ''}`}>
                {suggestion ? (
                    <div className="suggestion-content">
                        <div className="keyword-chips">
                            {suggestion.split(' ').slice(0, 15).map((word, index) => (
                                <span key={index} className="keyword-chip">{word}</span>
                            ))}
                        </div>
                    </div>
                ) : (
                    (isProcessing ? (
                        <div className="processing-message">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Generating your personalized suggestion...</span>
                        </div>
                    ) : (
                        <div className="no-suggestion-placeholder">
                            <Sparkles size={20} style={{ opacity: 0.3 }} />
                            <p>AI suggestions will appear here based on your conversation</p>
                        </div>
                    ))
                )}
                {isProcessing && (
                    <div className="processing-hint">
                        <span>💡 Tip: The AI is learning from your conversation to provide better suggestions</span>
                    </div>
                )}
            </div>

            <div className={`quick-actions-container ${isExhausted ? 'priority-exhaustion' : ''}`}>
                <div className="quick-actions-label" aria-label={isExhausted ? 'Suggested Exit Strategies' : 'Quick Responses'}>
                    <Zap size={10} aria-hidden="true" />
                    <span>{isExhausted ? 'Suggested Exit Strategies' : 'Quick Responses'}</span>
                </div>
                <div className="quick-actions-list" role="toolbar" aria-label={isExhausted ? 'Suggested Exit Strategies' : 'Quick Responses'}>
                    {actions.map((action, i) => (
                        <button
                            key={i}
                            className={`quick-action-btn ${copied === i ? 'copied' : ''} ${isExhausted ? 'large-action' : ''}`}
                            onClick={() => handleQuickAction(action.text, i)}
                            aria-label={`Quick action: ${action.label}`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleQuickAction(action.text, i);
                                }
                            }}
                        >
                            {copied === i ? <ClipboardCheck size={12} aria-hidden="true" /> : <Zap size={12} style={{ opacity: 0.6 }} aria-hidden="true" />}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SuggestionHUD;