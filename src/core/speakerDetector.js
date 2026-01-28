/**
 * Speaker Detector for ConvoCue 2
 * Encapsulates volume analysis and keyword heuristics for speaker identification.
 */

import { detectSpeakerHint } from './intentEngine';

export class SpeakerDetector {
    constructor() {
        this.meVolumeBaseline = 0;
        this.speakerConfidence = { me: 0, them: 0 };
        this.lastManualToggle = 0;
        this.lastSuggestionTime = 0;
    }

    calculateVolume(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }

    recordManualToggle() {
        this.lastManualToggle = Date.now();
        this.speakerConfidence = { me: 0, them: 0 };
    }

    recordSuggestionShown() {
        this.lastSuggestionTime = Date.now();
    }

    /**
     * Detects speaker based on audio volume.
     * @returns {string|null} 'me' if high confidence it's the user, else null
     */
    detectFromVolume(audioData, currentSpeaker) {
        const currentVolume = this.calculateVolume(audioData);
        const timeSinceManualToggle = Date.now() - this.lastManualToggle;
        const isManualLockActive = timeSinceManualToggle < 3000;

        if (currentSpeaker === 'me') {
            // Update "Me" baseline
            this.meVolumeBaseline = this.meVolumeBaseline === 0 
                ? currentVolume 
                : this.meVolumeBaseline * 0.95 + currentVolume * 0.05;
            return null;
        } 
        
        if (this.meVolumeBaseline > 0.01 && !isManualLockActive) {
            if (currentVolume > this.meVolumeBaseline * 0.7) {
                this.speakerConfidence = { me: 0, them: 0 };
                return 'me';
            }
            this.meVolumeBaseline *= 0.999;
        } else if (this.meVolumeBaseline === 0 && currentVolume > 0.05) {
            this.meVolumeBaseline = currentVolume;
            if (currentVolume > 0.1) {
                this.speakerConfidence = { me: 0, them: 0 };
                return 'me';
            }
        }
        
        return null;
    }

    /**
     * Detects speaker based on text content and timing.
     * @returns {string|null} 'me' or 'them' if a change is detected, else null
     */
    detectFromText(text, currentSpeaker) {
        const speakerHint = detectSpeakerHint(text, currentSpeaker);
        const timeSinceLastSuggestion = Date.now() - this.lastSuggestionTime;
        const timeSinceManualToggle = Date.now() - this.lastManualToggle;
        const isManualLockActive = timeSinceManualToggle < 3000;

        if (isManualLockActive) return null;

        // Priority 1: Content-based hint
        if (speakerHint) {
            this.speakerConfidence[speakerHint] += text.length > 20 ? 2 : 1;
            
            if (this.speakerConfidence[speakerHint] >= 2) {
                const detected = speakerHint !== currentSpeaker ? speakerHint : null;
                this.speakerConfidence = { me: 0, them: 0 };
                return detected;
            }
        } else {
            this.speakerConfidence.me = Math.max(0, this.speakerConfidence.me - 0.5);
            this.speakerConfidence.them = Math.max(0, this.speakerConfidence.them - 0.5);
        }

        // Priority 2: Timing-based heuristic
        if (currentSpeaker === 'them' && timeSinceLastSuggestion < 10000 && timeSinceLastSuggestion > 500) {
            if (/^(i |my |that's )/i.test(text)) {
                this.speakerConfidence = { me: 0, them: 0 };
                return 'me';
            }
        }

        return null;
    }
}
