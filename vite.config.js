import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream', 'events', 'url', 'path', 'crypto'],
      globals: { Buffer: true, global: true, process: true },
    })
  ],
  worker: {
    format: 'es',
  },
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'esnext',
  }
})
