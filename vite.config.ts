import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import inject from '@rollup/plugin-inject';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      process: path.resolve(__dirname, 'node_modules/process/browser.js'),
      buffer: path.resolve(__dirname, 'node_modules/buffer/index.js'),
      stream: path.resolve(__dirname, 'node_modules/stream-browserify/index.js'),
      util: path.resolve(__dirname, 'node_modules/util/'),
      assert: path.resolve(__dirname, 'node_modules/assert/'),
      zlib: path.resolve(__dirname, 'node_modules/browserify-zlib/'),
    },
  },
  optimizeDeps: {
    include: ['process', 'buffer', 'util', 'stream', 'assert', 'browserify-zlib'],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        inject({
          process: 'process',
          // Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  },
});
