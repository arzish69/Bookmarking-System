import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.js'), // Background script
        content: resolve(__dirname, 'src/content.js'), // Content script
        conten: resolve(__dirname, 'src/conten.css'),
        popu: resolve(__dirname, 'src/popu.css'),
        popup: resolve(__dirname, 'src/popup.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        dir: 'dist', // Final output folder
        format: 'esm',
      },
    },
  },
  publicDir: 'public', // Copies static files like manifest.json and icons
});
