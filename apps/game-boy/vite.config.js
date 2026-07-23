import glsl from 'vite-plugin-glsl';
import { fileURLToPath, URL } from 'node:url';

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

export default {
    publicDir: './public/',
    base: './',
    resolve:
    {
        alias:
        [
            {
                find: /^pixi\.js$/,
                replacement: fileURLToPath(new URL('./src/core/pixi-lite.ts', import.meta.url)),
            },
        ],
    },
    server:
    {
        host: true,
        open: !isCodeSandbox // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: './dist',
        emptyOutDir: true,
        modulePreload: {
            polyfill: false,
        },
        sourcemap: true,
    },
    plugins: [glsl()],
}
