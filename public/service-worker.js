// Service Worker for caching WASM and ONNX models
const CACHE_NAME = 'convocue-models-v2'; // Updated version
const MODEL_FILES = [
    '/ort-wasm-simd-threaded.jsep.mjs',
    '/ort-wasm-simd-threaded.jsep.wasm',
    '/ort-wasm-simd-threaded.mjs',
    '/ort-wasm-simd-threaded.wasm',
    '/silero_vad_v5.onnx',
    // Add Hugging Face transformer model files that will be cached by the library
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@latest/dist/transformers.js',
    // ONNX model files will be cached dynamically as they are requested
];

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching model files...');
                return cache.addAll(MODEL_FILES);
            })
            .then(() => {
                console.log('Model files cached successfully');
                self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('Failed to cache model files:', error);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Handle requests for model files
    const urlPath = event.request.url.substring(event.request.url.indexOf('/'));
    const isModelFile = MODEL_FILES.some(model =>
        event.request.url.includes(model) ||
        urlPath.includes(model) ||
        event.request.url.includes('onnx') ||
        event.request.url.includes('whisper') ||
        event.request.url.includes('SmolLM')
    );

    if (isModelFile) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Return cached version if available
                    if (response) {
                        console.log('Serving from cache:', event.request.url);
                        return response;
                    }

                    // Otherwise fetch from network and cache for future use
                    return fetch(event.request)
                        .then((networkResponse) => {
                            // Clone the response to store in cache
                            const responseClone = networkResponse.clone();

                            // Open cache and store the response
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });

                            return networkResponse;
                        })
                        .catch((error) => {
                            console.error('Failed to fetch model file:', event.request.url, error);
                            return new Response('Model file not available', { status: 503 });
                        });
                })
        );
    }
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(
        clients.claim() // Take control of all pages
    );
});