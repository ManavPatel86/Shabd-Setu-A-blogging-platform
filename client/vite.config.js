import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
   resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    globals: true,
    css: true,
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    exclude: [
      'node_modules/**', 
      'dist/**', 
      'assets/**',
      'coverage/**',
      'tests/components/ui/**',
      'tests/components/*Topbar*.test.{js,jsx}',
      'tests/components/Topbar/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: false,
      reportsDirectory: './coverage',
      exclude: [
        'src/components/ui/**',
        'src/components/Topbar.jsx',
        'src/components/*Topbar*',
        'src/assets/**',
        'node_modules/**',
        'dist/**',
        'coverage/**',
      ],
    },
  },
})