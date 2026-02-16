import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

// Senior Frontend Engineer: Explicitly import process to resolve the 'cwd' property error on the process object in TypeScript.
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This creates the global process.env.API_KEY variable in the browser
      // It checks for API_KEY, VITE_API_KEY, and the API_Key found in your screenshot.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || env.API_Key),
    },
  };
});
