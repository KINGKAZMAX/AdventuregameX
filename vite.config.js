export default {
  base: './',
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    host: true,
    fs: {
      allow: ['.'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: {
      polyfill: false,
    },
    sourcemap: true,
  },
};
