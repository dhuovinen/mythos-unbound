import { defineConfig } from 'vite';

// Port 3033 is reserved for games-strategy-001 in ~/Projects/app-registry (frontend range 3000-3999).
export default defineConfig({
  server: { port: 3033, strictPort: true },
  preview: { port: 3033, strictPort: true },
});
