/* ---------------------------------------------------------------------------------------
* about:真实 Node fetch 网络请求测试
* ---------------------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest'
import axiosShell, { AxiosError, AxiosResponse } from '../../src/index'

interface FetchResponse {
  data: unknown;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * 使用 Node.js 内置 fetch 的真实请求 adapter
 */
async function fetchAdapter(config: Record<string, unknown>): Promise<FetchResponse> {
  const { baseURL, url, method, headers, data, params } = config

  // 构建 URL
  let fullUrl = `${baseURL as string}${url as string}`

  // GET 请求参数拼接到 URL
  if (method === 'get' && params) {
    const searchParams = new URLSearchParams()
    const paramsObj = params as Record<string, string>
    for (const key in paramsObj) {
      searchParams.append(key, String(paramsObj[key]))
    }
    fullUrl += `?${searchParams.toString()}`
  }

  // 构建请求选项
  const fetchOptions: RequestInit = {
    method: (method as string).toUpperCase(),
    headers: headers as Record<string, string>,
  }

  // POST 等请求添加 body
  if (data && method !== 'get') {
    fetchOptions.body = JSON.stringify(data)
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    }
  }

  const response = await fetch(fullUrl, fetchOptions)

  // 转换 headers 为对象
  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  // 尝试解析 JSON，失败则返回空对象
  let responseData: unknown = null
  try {
    responseData = await response.json()
  } catch {
    // 非 JSON 响应
  }

  const result: FetchResponse = {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  }

  // 非 2xx 状态码视为错误
  if (!response.ok) {
    return Promise.reject(result)
  }

  return result
}

describe('axiosShell-真实网络请求测试', function () {
  const httpbinAxios = axiosShell.create({
    baseURL: 'https://httpbin.org',
    adapter: fetchAdapter,
    timeout: 10000,
  })

  it('GET 请求 - 获取 JSON 数据', async () => {
    const res = await httpbinAxios.get('/get', {}, { params: { foo: 'bar', test: '123' } }) as AxiosResponse

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('args')
    expect((res.data as Record<string, unknown>).args).toMatchObject({
      foo: 'bar',
      test: '123',
    })
  })

  it('POST 请求 - 发送 JSON 数据', async () => {
    const postData = { name: 'test', value: 42 }
    const res = await httpbinAxios.post('/post', postData) as AxiosResponse

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('json')
    expect((res.data as Record<string, unknown>).json).toMatchObject(postData)
  })

  it('请求头传递', async () => {
    const customHeaders = { 'X-Custom-Header': 'test-value' }
    const headerAxios = axiosShell.create({
      baseURL: 'https://httpbin.org',
      adapter: fetchAdapter,
      headers: customHeaders,
    })

    const res = await headerAxios.get('/headers') as AxiosResponse

    expect(res.status).toBe(200)
    const headers = (res.data as Record<string, unknown>).headers as Record<string, string>
    expect(headers['X-Custom-Header']).toBe('test-value')
  })

  it('响应状态码判断', async () => {
    const res = await httpbinAxios.get('/status/200') as AxiosResponse
    expect(res.status).toBe(200)
  })

  it('404 错误处理', async () => {
    await expect(httpbinAxios.get('/status/404')).rejects.toBeInstanceOf(AxiosError)
    try {
      await httpbinAxios.get('/status/404')
    } catch (error) {
      const axiosError = error as AxiosError
      expect(axiosError.code).toBe('ERR_NETWORK')
      expect(axiosError.config).toBeDefined()
    }
  })

  it('拦截器在真实请求中的工作', async () => {
    let requestIntercepted = false
    let responseIntercepted = false

    httpbinAxios.interceptors.request.use(
      config => {
        requestIntercepted = true
        return config
      },
      error => Promise.reject(error),
    )

    httpbinAxios.interceptors.response.use(
      response => {
        responseIntercepted = true
        return response
      },
      error => Promise.reject(error),
    )

    await httpbinAxios.get('/get')

    expect(requestIntercepted).toBe(true)
    expect(responseIntercepted).toBe(true)
  })
})
