import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './App.css'

// Check WebGPU support and log it
async function checkWebGPUSupport() {
  if (!navigator.gpu) {
    console.log('WebGPU is not supported in this browser.');
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.log('No appropriate GPUAdapter found.');
      return false;
    }

    console.log('WebGPU is supported and initialized successfully!');
    console.log('Adapter info:', adapter.name || 'Unknown', '(Vendor:', adapter.vendor || 'Unknown', ')');
    return true;
  } catch (err) {
    console.error('Error initializing WebGPU:', err);
    return false;
  }
}

// Register service worker for model caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Check WebGPU support on app load
checkWebGPUSupport().then(isSupported => {
  if (isSupported) {
    console.log('ConvoCue2 will use WebGPU acceleration for improved performance!');
  } else {
    console.log('ConvoCue2 will fall back to WASM for model inference.');
  }
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
