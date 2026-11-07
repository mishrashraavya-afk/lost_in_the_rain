export default {
  // relative base so the build also works inside Capacitor's webview
  base: './',
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
};
