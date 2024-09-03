import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';



export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['intro.wav', 'login.wav', 'sent1.wav', 'sent2.wav', 'sent3.wav', 'sent4.wav', 'sent5.wav', 'sent6.wav', 'uploadfail.wav', 'water1.wav', 'water2.wav', 'water3.wav', 'water4.wav', 'water5.wav', 'water6.wav', 'water7.wav', 'water8.wav', 'water9.wav', 'water10.wav', 'index.html'],
      manifest: {
        name: 'Notebrook',
        short_name: 'Notebrook',
        description: 'Notebrook, stream of consciousness accessible note taking',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        
        // workbox options for the service worker
      },
    }),
  ],
});