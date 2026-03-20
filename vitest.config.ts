import { defineConfig } from 'vitest/config'
import path from 'path'

const isProdEnv = process.env.NODE_ENV === 'prod'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // prod 模式下测试构建后的产物
    ...(isProdEnv && {
      alias: {
        '@/': path.resolve(__dirname, './lib/'),
        '@': path.resolve(__dirname, './lib'),
      },
    }),
  },
})
