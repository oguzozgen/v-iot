import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 5500, // increase limit to 1500 kB
  },
  /*server: {
    port: 3000,
  },*/
})
