import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Senior Engineer Note: We use a dynamic expression string so that process.env.API_KEY 
      // is evaluated at runtime in the browser, allowing the platform to inject 
      // updated keys from the selection dialog without a re-build.
      'process.env.API_KEY': '(globalThis.process?.env?.API_KEY || ' + JSON.stringify(env.VITE_API_KEY || env.API_KEY || "") + ')',
    },
  };
});