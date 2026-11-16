import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const CESIUM_SOURCE = 'node_modules/cesium/Build/Cesium';
const CESIUM_BASE_URL = 'cesiumStatic';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: `${CESIUM_SOURCE}/ThirdParty/**/*`,
          dest: CESIUM_BASE_URL,
          rename: { stripBase: 4 },
        },
        {
          src: `${CESIUM_SOURCE}/Workers/**/*`,
          dest: CESIUM_BASE_URL,
          rename: { stripBase: 4 },
        },
        {
          src: `${CESIUM_SOURCE}/Assets/**/*`,
          dest: CESIUM_BASE_URL,
          rename: { stripBase: 4 },
        },
        {
          src: `${CESIUM_SOURCE}/Widgets/**/*`,
          dest: CESIUM_BASE_URL,
          rename: { stripBase: 4 },
        },
      ],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/${CESIUM_BASE_URL}`),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
          'react-vendor': ['react', 'react-dom', 'lucide-react', 'vaul'],
        },
      },
    },
  },
});

