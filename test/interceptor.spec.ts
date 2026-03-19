import { describe, expect, it } from 'vitest'
import axiosShell, { RequestConfig } from '../src/index'

interface TestResponse {
  data: unknown
  status: number
  config: RequestConfig
}

interface TestError {
  status: number
  message: string
  config: RequestConfig
}

describe('InterceptorManager - 拦截器功能测试', () => {
  function createTestInstance(adapter?: (config: RequestConfig) => Promise<unknown>) {
    return axiosShell.create({
      baseURL: 'https://test.com',
      adapter: adapter || (() => Promise.resolve({ data: 'success', status: 200 })),
    })
  }

  describe('基础功能', () => {
    it('use() 返回拦截器 ID', () => {
      const instance = createTestInstance()
      const id1 = instance.interceptors.request.use(c => c)
      const id2 = instance.interceptors.request.use(c => c)

      expect(typeof id1).toBe('number')
      expect(typeof id2).toBe('number')
      expect(id2).toBeGreaterThan(id1)
    })

    it('eject() 移除指定拦截器', async () => {
      const instance = createTestInstance()
      let called = false

      const id = instance.interceptors.request.use(config => {
        called = true
        return config
      })

      instance.interceptors.request.eject(id)
      await instance.get('/test')

      expect(called).toBe(false)
    })

    it('clear() 清空所有拦截器', async () => {
      const instance = createTestInstance()
      let callCount = 0

      instance.interceptors.request.use(config => {
        callCount++
        return config
      })
      instance.interceptors.request.use(config => {
        callCount++
        return config
      })

      instance.interceptors.request.clear()
      await instance.get('/test')

      expect(callCount).toBe(0)
    })
  })

  describe('请求拦截器', () => {
    it('可以修改请求配置', async () => {
      const instance = createTestInstance()
      let receivedHeaders: Record<string, string> | undefined

      // 第二个添加的拦截器先执行（读取 headers）
      instance.interceptors.request.use(config => {
        receivedHeaders = config.headers
        return config
      })

      // 第一个添加的拦截器后执行（修改 headers）
      instance.interceptors.request.use(config => {
        config.headers = { ...config.headers, 'X-Custom': 'test-value' }
        return config
      })

      await instance.get('/test')

      expect(receivedHeaders).toHaveProperty('X-Custom', 'test-value')
    })

    it('多个请求拦截器：后添加的先执行（Axios 标准）', async () => {
      const instance = createTestInstance()
      const order: number[] = []

      instance.interceptors.request.use(config => {
        order.push(1)
        return config
      })
      instance.interceptors.request.use(config => {
        order.push(2)
        return config
      })
      instance.interceptors.request.use(config => {
        order.push(3)
        return config
      })

      await instance.get('/test')

      // Axios 标准：请求拦截器后添加的先执行
      expect(order).toEqual([3, 2, 1])
    })
  })

  describe('响应拦截器', () => {
    it('可以获取响应数据', async () => {
      const instance = createTestInstance(() =>
        Promise.resolve({ data: { name: 'test' }, status: 200 }),
      )
      let receivedData: unknown

      instance.interceptors.response.use(response => {
        receivedData = (response as TestResponse).data
        return response
      })

      const res = await instance.get('/test') as TestResponse

      expect(receivedData).toEqual({ name: 'test' })
      expect(res.data).toEqual({ name: 'test' })
    })

    it('响应拦截器可以获取原始 config', async () => {
      const instance = createTestInstance((config: RequestConfig) =>
        Promise.resolve({
          data: 'success',
          status: 200,
          config,
        }),
      )
      let capturedConfig: RequestConfig | undefined

      instance.interceptors.response.use(response => {
        capturedConfig = (response as TestResponse).config
        return response
      })

      await instance.get('/api/users', {}, { headers: { 'X-Request': 'yes' } })

      expect(capturedConfig).toBeDefined()
      expect(capturedConfig?.url).toBe('/api/users')
      expect(capturedConfig?.headers).toHaveProperty('X-Request', 'yes')
    })

    it('多个响应拦截器按添加顺序执行', async () => {
      const instance = createTestInstance()
      const order: number[] = []

      instance.interceptors.response.use(res => {
        order.push(1)
        return res
      })
      instance.interceptors.response.use(res => {
        order.push(2)
        return res
      })

      await instance.get('/test')

      expect(order).toEqual([1, 2])
    })

    it('响应拦截器可以修改响应数据', async () => {
      const instance = createTestInstance(() =>
        Promise.resolve({ data: { value: 1 }, status: 200 }),
      )

      instance.interceptors.response.use(response => {
        const res = response as TestResponse
        res.data = { ...res.data, modified: true }
        return res
      })

      const res = await instance.get('/test') as TestResponse

      expect(res.data).toHaveProperty('modified', true)
      expect(res.data).toHaveProperty('value', 1)
    })
  })

  describe('错误处理', () => {
    it('请求拦截器 rejected 处理请求错误', async () => {
      const instance = createTestInstance()
      let errorHandled = false

      instance.interceptors.request.use(
        () => Promise.reject(new Error('request failed')),
        error => {
          errorHandled = true
          return Promise.reject(error)
        },
      )

      await expect(instance.get('/test')).rejects.toThrow('request failed')
    })

    it('响应拦截器 rejected 处理响应错误', async () => {
      const instance = createTestInstance(() =>
        Promise.reject({ status: 500, message: 'server error' }),
      )
      let capturedError: unknown

      instance.interceptors.response.use(
        res => res,
        error => {
          capturedError = error
          return Promise.reject(error)
        },
      )

      await expect(instance.get('/test')).rejects.toMatchObject({ status: 500 })
      expect(capturedError).toMatchObject({ status: 500 })
    })

    it('错误拦截器可以获取 config 信息', async () => {
      const instance = createTestInstance((config: RequestConfig) =>
        Promise.reject({
          status: 500,
          message: 'server error',
          config,
        }),
      )
      let capturedConfig: RequestConfig | undefined

      instance.interceptors.response.use(
        res => res,
        (error: TestError) => {
          capturedConfig = error.config
          return Promise.reject(error)
        },
      )

      await expect(instance.get('/api/error', {}, { headers: { 'X-Test': '1' } })).rejects.toMatchObject({ status: 500 })

      expect(capturedConfig).toBeDefined()
      expect(capturedConfig?.url).toBe('/api/error')
    })
  })

  describe('失败重发（Retry）', () => {
    it('响应错误时可以重试请求', async () => {
      let attemptCount = 0
      let retryCount = 0
      const maxRetries = 2

      const instance = createTestInstance((config: RequestConfig) => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject({ status: 500, message: 'temporary error', config })
        }
        return Promise.resolve({ data: 'success after retry', status: 200, config })
      })

      instance.interceptors.response.use(
        res => res,
        async (error: TestError) => {
          if (retryCount < maxRetries) {
            retryCount++
            return instance.get(error.config.url || '', {}, error.config)
          }
          return Promise.reject(error)
        },
      )

      const res = await instance.get('/retry') as TestResponse

      expect(attemptCount).toBe(3)
      expect(res.data).toBe('success after retry')
    })

    it('重试次数限制后仍然失败', async () => {
      let attemptCount = 0
      let retryCount = 0
      const maxRetries = 2

      const instance = createTestInstance((config: RequestConfig) => {
        attemptCount++
        return Promise.reject({ status: 500, message: 'permanent error', config })
      })

      instance.interceptors.response.use(
        res => res,
        async (error: TestError) => {
          if (retryCount < maxRetries) {
            retryCount++
            return instance.get(error.config.url || '', {}, error.config)
          }
          return Promise.reject(error)
        },
      )

      await expect(instance.get('/retry')).rejects.toMatchObject({ status: 500 })
      expect(attemptCount).toBe(3)
    })
  })

  describe('请求与响应拦截器协作', () => {
    it('请求拦截器修改的 config 在响应拦截器中可获取', async () => {
      const instance = createTestInstance((config: RequestConfig) =>
        Promise.resolve({ data: 'ok', status: 200, config }),
      )
      let configInResponse: RequestConfig | undefined

      instance.interceptors.request.use(config => {
        config.headers = { ...config.headers, 'X-Added': 'by-request-interceptor' }
        return config
      })

      instance.interceptors.response.use(response => {
        configInResponse = (response as TestResponse).config
        return response
      })

      await instance.get('/test')

      expect(configInResponse?.headers).toHaveProperty('X-Added', 'by-request-interceptor')
    })

    it('完整的请求-响应链路（Axios 标准顺序）', async () => {
      const logs: string[] = []
      const instance = createTestInstance((config: RequestConfig) => {
        logs.push('adapter')
        return Promise.resolve({ data: config, status: 200, config })
      })

      instance.interceptors.request.use(config => {
        logs.push('request-1')
        return config
      })
      instance.interceptors.request.use(config => {
        logs.push('request-2')
        return config
      })
      instance.interceptors.response.use(res => {
        logs.push('response-1')
        return res
      })
      instance.interceptors.response.use(res => {
        logs.push('response-2')
        return res
      })

      await instance.get('/test')

      expect(logs).toEqual(['request-2', 'request-1', 'adapter', 'response-1', 'response-2'])
    })
  })
})
