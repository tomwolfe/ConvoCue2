# ConvoCue 2: AI & Personalization Guide

ConvoCue 2 uses a modular AI architecture to provide real-time social cues tailored to your specific needs and current social energy.

## 🧠 How it Works

1.  **Voice Activity Detection (VAD):** Uses Silero VAD to detect when speech starts and ends locally in your browser.
2.  **Speech-to-Text (STT):** Transcribes audio using `whisper-tiny.en` running on WASM.
3.  **Intent Engine:** A keyword-based heuristic engine analyzes the transcript to categorize the conversation into:
    *   **Social:** Casual talk, hobbies, greetings.
    *   **Professional:** Work, projects, deadlines.
    *   **Conflict:** Disagreements, errors, frustrations.
    *   **Empathy:** Sharing feelings, seeking support.
4.  **LLM Generation:** `SmolLM2-135M` generates a concise (under 15 words) suggestion based on the detected intent and your selected **Persona**.

## 👤 Personas (Personalization)

You can switch personas at any time to change the "voice" of your co-pilot:

*   **Anxiety Coach:** Provides validating, low-pressure cues to bridge silences.
*   **Pro Exec:** Sharp, authoritative advice for workplace dominance and clarity.
*   **EQ Coach:** Focuses on emotional labeling and deepening connections.
*   **Culture Guide:** Navigates high/low context differences and "saving face".

## 🔋 Social Battery

The **Social Battery** is a unique feature that tracks your estimated social fatigue.
*   **Deduction:** Every word processed drains a small amount of battery. 
*   **Multipliers:** High-stakes intents like `Conflict` drain battery 2x faster than `Social` talk.
*   **Exhaustion Mode:** When battery falls below 20%, ConvoCue automatically pivots all personas to prioritize **Exit Strategies** and minimal-energy responses.

## 👥 Speaker Labeling

Since ConvoCue 2 runs entirely locally for privacy, it uses a manual **Speaker Toggle**. 
*   Tap the speaker badge (You/Them) to tell the AI who is currently speaking. 
*   This context is passed to the LLM to ensure suggestions are relevant (e.g., suggesting a reply when they speak, or a follow-up when you speak).

---
*Privacy Note: All processing happens locally on your device. No audio or transcripts are sent to any server.*
