import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const projectRoot = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  publicDir: resolve(projectRoot, 'models'),
  server: { port: 5173, strictPort: true, host: '127.0.0.1' }
});
