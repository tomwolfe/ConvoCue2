import React from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { Mic, MicOff, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

const VAD = ({ onSpeechEnd, isReady, status }) => {
    const [vadError, setVadError] = React.useState(null);
    const [permissionDenied, setPermissionDenied] = React.useState(false);
    const vad = useMicVAD({
        startOnLoad: false,
        onSpeechEnd: (audio) => {
            onSpeechEnd(new Float32Array(audio));
        },
        onError: (err) => {
            console.error('VAD Error:', err);

            // Check for permission-related errors
            if (err.name === 'NotAllowedError' || err.message.includes('permission') || err.message.includes('denied')) {
                setPermissionDenied(true);
                setVadError('Microphone access denied. Please allow microphone permission in your browser settings.');
            } else if (err.name === 'NotFoundError' || err.message.includes('device')) {
                setVadError('No microphone found. Please connect a microphone and refresh the page.');
            } else if (err.name === 'NotReadableError' || err.message.includes('hardware')) {
                setVadError('Microphone hardware error. Please check your microphone settings.');
            } else {
                setVadError(err.message || 'Microphone error occurred');
            }
        },
        workletURL: "/vad.worklet.bundle.min.js",
        modelURL: "/silero_vad_v5.onnx",
        model: "v5",
        onnxWASMPaths: "/",
    });

    React.useEffect(() => {
        if (isReady && !vad.listening && !vad.loading && !vadError) {
            vad.start();
        }
    }, [isReady, vad.loading, vadError]);

    const requestPermission = () => {
        setPermissionDenied(false);
        setVadError(null);

        // Request microphone permission explicitly
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
                // Restart VAD after getting permission
                vad.start();
            })
            .catch(err => {
                console.error('Permission request failed:', err);
                setVadError('Microphone permission still denied. Please enable it in browser settings.');
            });
    };

    const toggleMic = () => {
        if (vad.listening) {
            vad.pause();
        } else {
            vad.start();
        }
    };

    return (
        <div className="vad-controls">
            <button
                onClick={toggleMic}
                disabled={!isReady || permissionDenied}
                className={`btn-mic ${vad.listening ? 'active' : ''} ${permissionDenied ? 'permission-denied' : ''}`}
            >
                {vad.listening ? <Mic size={24} /> : <MicOff size={24} />}
                <span>{vad.listening ? 'Listening...' : permissionDenied ? 'Permission Denied' : 'Start Listening'}</span>
            </button>
            <div className="status-indicator">
                {(status === 'Loading Models...' || status === 'Processing...') && <Loader2 className="animate-spin" size={16} />}
                {vadError && (
                    <div className="error-container">
                        <AlertTriangle size={16} className="error-icon" />
                        <span className="text-error">{vadError}</span>
                    </div>
                )}
                {!vadError && !permissionDenied && <span>{status}</span>}
            </div>
            {permissionDenied && (
                <div className="permission-help">
                    <button className="btn-permission-help" onClick={requestPermission}>
                        <RotateCcw size={14} />
                        <span>Request Permission</span>
                    </button>
                    <p className="permission-instructions">
                        Click above or go to browser settings → Permissions → Microphone → Allow
                    </p>
                </div>
            )}
            {vad.listening && (
                <div className="audio-visualizer-simple">
                    <div className="wave-animation"></div>
                </div>
            )}
        </div>
    );
};

export default VAD;
