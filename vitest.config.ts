import { defineConfig } from 'vitest/config'
import path from 'path'

const isProdEnv = process.env.NODE_ENV === 'prod'

export default defineConfig({
  resolve: {
    alias: {
      '@': isProdEnv
        ? path.resolve(__dirname, './lib')
        : path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
