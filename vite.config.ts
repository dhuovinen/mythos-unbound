import { defineConfig } from 'vite';

// Port 3033 is reserved for mythos-unbound in ~/Projects/app-registry (frontend range 3000-3999).
//
// host: true binds both IP stacks. Without it Vite binds IPv6 only, so http://127.0.0.1:3033 is
// refused and any browser resolving "localhost" to IPv4 sees connection-refused — which looks
// exactly like the dev server not running. It also breaks the 127.0.0.1 health_url registered for
// this app in ~/Projects/app-registry. Note this does expose the dev server on the local network.
export default defineConfig({
  build: { rollupOptions: { input: ['index.html', 'rig.html'] } },
  server: { port: 3033, strictPort: true, host: true },
  preview: { port: 3033, strictPort: true, host: true },
});
