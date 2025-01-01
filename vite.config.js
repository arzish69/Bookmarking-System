import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'extension', // Output folder for the build
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.js'), // Background script
        content: resolve(__dirname, 'src/content.js'),        // Popup HTML as entry point
        popup: resolve(__dirname, 'src/popup.js'),
        popu: resolve(__dirname, 'src/popu.css'),      // Popup CSS
        conten: resolve(__dirname, 'src/conten.css'),   // Content CSS
      },
      output: {
        entryFileNames: '[name].js',        // JS files naming
        chunkFileNames: '[name].js',        // Chunk files naming
        assetFileNames: '[name].[ext]',     // Asset files naming
        dir: 'extension',                        // Final output directory
        format: 'esm',                      // Use ES modules
      },
    },
  },
  publicDir: 'public', // Copies static files like manifest.json and icons
  define: {
    'process.env': {}, // Ensure compatibility with packages expecting process.env
  },
});
