/* ---------------------------------------------------------------------------------------
* about:真实 Node fetch 网络请求测试（使用 bing.com）
* ---------------------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest'
import axiosShell, { AxiosError, AxiosResponse } from '@/index'

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

  // 尝试解析 JSON，失败则返回文本
  let responseData: unknown = null
  const contentType = response.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }
  } catch {
    // 解析失败返回 null
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
  const bingAxios = axiosShell.create({
    baseURL: 'https://www.bing.com',
    adapter: fetchAdapter,
    timeout: 15000,
  })

  it('GET 请求 - 访问 bing.com', async () => {
    const res = await bingAxios.get('/') as AxiosResponse

    expect(res.status).toBe(200)
    expect(res.data).toBeDefined()
  }, 15000)

  it('请求头传递', async () => {
    const customHeaders = { 'X-Custom-Header': 'test-value' }
    const headerAxios = axiosShell.create({
      baseURL: 'https://www.bing.com',
      adapter: fetchAdapter,
      timeout: 15000,
      headers: customHeaders,
    })

    const res = await headerAxios.get('/') as AxiosResponse
    expect(res.status).toBe(200)
  }, 15000)

  it('响应状态码判断', async () => {
    const res = await bingAxios.get('/') as AxiosResponse
    expect(res.status).toBe(200)
  }, 15000)

  it('拦截器在真实请求中的工作', async () => {
    let requestIntercepted = false
    let responseIntercepted = false

    bingAxios.interceptors.request.use(
      config => {
        requestIntercepted = true
        return config
      },
      error => Promise.reject(error),
    )

    bingAxios.interceptors.response.use(
      response => {
        responseIntercepted = true
        return response
      },
      error => Promise.reject(error),
    )

    await bingAxios.get('/')

    expect(requestIntercepted).toBe(true)
    expect(responseIntercepted).toBe(true)
  }, 15000)
})
