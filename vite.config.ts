import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load environment variables from the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      /**
       * We map 'process.env.API_KEY' in the source code to the value found in the environment.
       * We check API_KEY, API_Key (observed in Netlify logs), and VITE_API_KEY for maximum compatibility.
       */
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.API_Key || env.VITE_API_KEY || ""),
    },
    // Ensure the build handles the environment variables correctly
    build: {
      sourcemap: false,
      outDir: 'dist',
    }
  };
});