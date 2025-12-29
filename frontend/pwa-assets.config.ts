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
            padding: 0  // No padding
        },
        apple: {
            sizes: [180],
            padding: 0  // No padding for iOS icons
        }
    },
    images: ['public/khoj-logo.jpg'],
})
