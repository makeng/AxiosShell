/* ---------------------------------------------------------------------------------------
 * about:主文件，导出一个类。更多细节可以参考 Axios 源码。
 * author:马兆铿（810768333@qq.com）
 * date:2020-06-09
 * ---------------------------------------------------------------------------------------- */

import InterceptorManager from './InterceptorManager';
import { deepMerge } from './utils/merge';

type Default = Record<string, unknown>;

type RequestConfig = {
  url?: string;
  method?: string;
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  baseURL?: string;
  timeout?: number;
  adapter?: (config: RequestConfig) => Promise<unknown>;
} & Record<string, unknown>;

type InterceptorHandler = {
  fulfilled: ((config: RequestConfig) => RequestConfig | Promise<RequestConfig>) | null;
  rejected: ((error: unknown) => unknown) | null;
};

class AxiosShell {
  adapter!: (config: RequestConfig) => Promise<unknown>;
  readonly defaults: RequestConfig = {};
  interceptors: {
    request: InterceptorManager;
    response: InterceptorManager;
  };

  // HTTP 方法声明
  get!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
  post!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
  head!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
  options!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
  put!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
  delete!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
  trace!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
  connect!: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;

  constructor(instanceConfig: RequestConfig = {}) {
    const { adapter } = instanceConfig;

    this.defaults = instanceConfig;
    // 一定要传入实际请求的方法
    if (adapter) {
      this.adapter = adapter;
    }
    // 拦截器桥接
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }

  /**
   * 创建
   * @param defaultConfig 默认配置
   * @returns {AxiosShell}
   */
  create(defaultConfig: RequestConfig): AxiosShell {
    const config = deepMerge(this.defaults, { adapter: this.adapter }, defaultConfig);
    return new AxiosShell(config);
  }

  /**
   * 带拦截器的请求
   * @param config
   */
  requestWithInterceptors(config: RequestConfig): Promise<unknown> {
    const mergedConfig = deepMerge(this.defaults, config); // 配置合并
    /**
     * 超时的 Promise
     * @param adapter 请求
     * @param countdown 倒计时
     * @returns {Promise<Awaited<unknown>>}
     */
    const createTimeoutRace = (adapter: Promise<unknown>, countdown: number) => {
      const createTimeoutPromise = (timeout: number) =>
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutErrorMessage = `Timeout of ${timeout}ms exceeded`;
            reject({
              status: 408, // 自己根据网络错误码写的，并非真的服务器报的
              message: timeoutErrorMessage,
            });
          }, timeout);
        });
      return Promise.race([adapter, createTimeoutPromise(countdown)]).catch((error: Record<string, unknown> & { status?: number }) => {
        !error.status && (error.status = 500);
        return Promise.reject(error);
      });
    };
    /**
     * 挂接拦截器
     * @param middle 中间的 promise
     * @returns {*[]}
     */
    const createInterceptorsChain = (middle: () => Promise<unknown>) => {
      // 需要构建 [fulfilled,rejected,fulfilled,rejected...] 的队列
      const chain: (((value: unknown) => unknown) | undefined)[] = [middle, undefined];

      // 创建请求链数组
      this.interceptors.request.forEach((interceptor: InterceptorHandler) => {
        chain.unshift(interceptor.fulfilled as (value: unknown) => unknown, interceptor.rejected as (value: unknown) => unknown);
      });
      this.interceptors.response.forEach((interceptor: InterceptorHandler) => {
        chain.push(interceptor.fulfilled as (value: unknown) => unknown, interceptor.rejected as (value: unknown) => unknown);
      });
      return chain;
    };
    // 核心请求
    const createRequest = () => this.adapter(mergedConfig);
    // 带上超时
    const { timeout } = mergedConfig;
    const requestGetData = timeout
      ? () => createTimeoutRace(createRequest(), timeout as number)
      : createRequest;
    let promise: Promise<unknown> = Promise.resolve(mergedConfig);
    // 链式请求生成
    const chain = createInterceptorsChain(requestGetData);
    // 请求链执行
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }
    return promise;
  }
}

// 增加请求方法
const httpMethods = ['get', 'post', 'head', 'options', 'put', 'delete', 'trace', 'connect'] as const;
type HttpMethod = typeof httpMethods[number];

httpMethods.forEach(method => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (AxiosShell.prototype as any)[method] = function createRequest(url = '', data = {}, config?: RequestConfig): Promise<unknown> {
    const nextConfig = deepMerge(config, { url, data, method });
    return this.requestWithInterceptors(nextConfig);
  };
});

const axiosShell = new AxiosShell();
export default axiosShell;
