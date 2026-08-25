import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'react-vendor',  test: /node_modules\/(react|react-dom|react-router)/ },
            { name: 'three-vendor',  test: /node_modules\/(three|@react-three)/ },
            { name: 'firebase',      test: /node_modules\/(firebase)/ },
            { name: 'motion',        test: /node_modules\/(framer-motion)/ },
            { name: 'pdf',           test: /node_modules\/(jspdf|html2canvas)/ },
          ]
        }
      }
    }
  }
})
