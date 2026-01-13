# ConvoCue 2 - Pareto Optimal Edition

This is a Pareto-optimal (80/20) reconstruction of the original ConvoCue application. It focuses on the core features that provide the most value with minimal complexity.

## Core "80/20" Features

1.  **Real-time Intent Detection**: High-performance, keyword-based intent recognition (Social, Professional, Conflict, Empathy).
2.  **Social Battery HUD**: Visual monitoring of social energy with adaptive exit strategies.
3.  **Smart AI Suggestions**: On-device LLM (SmolLM2) provides context-aware conversational cues.
4.  **Speech-to-Text**: Privacy-first, local transcription using Whisper Tiny.
5.  **Persona Orchestration**: Tailored coaching styles for Social Anxiety, Professional Excellence, EQ, and Cultural Intelligence.

## Technology Stack

- **Frontend**: React 19, Vite, Lucide Icons.
- **ML Inference**: Transformers.js (v3) with ONNX WebAssembly.
- **Audio**: Web Audio API with Silero VAD for voice activity detection.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Privacy

Like the original, ConvoCue 2 is **100% on-device**. No audio or text data is ever sent to a server.
