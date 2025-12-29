import {
    defineConfig,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
    headLinkOptions: {
        preset: '2023',
    },
    preset: {
        transparent: {
            sizes: [64, 192, 512],
            favicons: [[48, 'favicon.ico']]
        },
        maskable: {
            sizes: [512],
            padding: 0.05  // 5% padding instead of default 20%
        },
        apple: {
            sizes: [180],
            padding: 0.05,  // 5% padding for iOS icons
            resizeOptions: {
                fit: 'contain',  // Preserve aspect ratio
                background: { r: 0, g: 0, b: 0, alpha: 0 }  // Transparent background
            }
        }
    },
    images: ['public/khoj-logo.jpg'],
})
