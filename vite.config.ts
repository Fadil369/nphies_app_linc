import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-error-boundary'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-popover'
          ],
          'vendor-copilot': ['@copilotkit/react-core', '@copilotkit/react-ui'],
          'vendor-icons': ['@phosphor-icons/react'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-charts': ['recharts', 'd3']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit for now
    sourcemap: false, // Disable source maps in production for smaller size
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@copilotkit/react-core',
      '@copilotkit/react-ui',
      '@phosphor-icons/react'
    ]
  }
});
