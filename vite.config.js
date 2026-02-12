import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest', // Use custom SW
            srcDir: 'src',
            filename: 'sw.js',
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true,
                type: 'module', // Important for Dev mode
                navigateFallback: 'index.html',
            },
            includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'vite.svg'],
            manifest: {
                name: 'IB E-Diary',
                short_name: 'IB Diary',
                description: 'Professional Task Management and Diary Application',
                theme_color: '#2563EB',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                categories: ['productivity', 'business'],
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // server: {
    //     port: 5173,
    //     open: true,
    //     host: true
    // },
    server: {
        port: 5173,
        open: true,
        host: true,

        proxy: {
            '/api': {
                target: 'https://ibnotes.abisexport.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                secure: false
            }
        }
    },

});
