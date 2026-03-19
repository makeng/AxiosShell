/* ---------------------------------------------------------------------------------------
 * about:主文件，导出一个类。更多细节可以参考 Axios 源码。
 * ---------------------------------------------------------------------------------------- */

import InterceptorManager, { InterceptorHandler } from './InterceptorManager';
import { deepMerge } from './utils/merge';

interface RequestConfig extends Record<string, unknown> {
  url?: string;
  method?: string;
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  baseURL?: string;
  timeout?: number;
  adapter?: (config: RequestConfig) => Promise<unknown>;
}

class AxiosShell {
  adapter!: (config: RequestConfig) => Promise<unknown>;
  readonly defaults: RequestConfig = {};
  interceptors: {
    request: InterceptorManager<RequestConfig>;
    response: InterceptorManager<unknown>;
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
      request: new InterceptorManager<RequestConfig>(),
      response: new InterceptorManager<unknown>(),
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
    const mergedConfig = deepMerge(this.defaults, config) as RequestConfig;

    const createTimeoutRace = (adapter: Promise<unknown>, countdown: number) => {
      const createTimeoutPromise = (timeout: number) =>
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutErrorMessage = `Timeout of ${timeout}ms exceeded`;
            reject({
              status: 408,
              message: timeoutErrorMessage,
            });
          }, timeout);
        });
      return Promise.race([adapter, createTimeoutPromise(countdown)]).catch((error: Record<string, unknown> & { status?: number }) => {
        !error.status && (error.status = 500);
        return Promise.reject(error);
      });
    };

    const createInterceptorsChain = (middle: () => Promise<unknown>) => {
      const chain: (((value: unknown) => unknown) | undefined)[] = [middle, undefined];

      // 请求拦截器：后添加的先执行
      this.interceptors.request.forEach((interceptor) => {
        chain.unshift(
          interceptor.fulfilled as (value: unknown) => unknown,
          interceptor.rejected as (value: unknown) => unknown
        );
      });

      // 响应拦截器：按添加顺序执行
      this.interceptors.response.forEach((interceptor) => {
        chain.push(
          interceptor.fulfilled as (value: unknown) => unknown,
          interceptor.rejected as (value: unknown) => unknown
        );
      });
      return chain;
    };

    // 核心请求
    const createRequest = () => this.adapter(mergedConfig).then(response => {
      if (typeof response === 'object' && response !== null) {
        (response as Record<string, unknown>).config = mergedConfig;
      }
      return response;
    }).catch(error => {
      if (typeof error === 'object' && error !== null) {
        (error as Record<string, unknown>).config = mergedConfig;
      }
      return Promise.reject(error);
    });

    const { timeout } = mergedConfig;
    const requestGetData = timeout
      ? () => createTimeoutRace(createRequest(), timeout as number)
      : createRequest;

    let promise: Promise<unknown> = Promise.resolve(mergedConfig);
    const chain = createInterceptorsChain(requestGetData);

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }
    return promise;
  }
}

// 增加请求方法
const httpMethods = ['get', 'post', 'head', 'options', 'put', 'delete', 'trace', 'connect'] as const;

httpMethods.forEach(method => {
  AxiosShell.prototype[method] = function createRequest(url = '', data = {}, config?: RequestConfig): Promise<unknown> {
    const nextConfig = deepMerge(config, { url, data, method }) as RequestConfig;
    return this.requestWithInterceptors(nextConfig);
  };
});

const axiosShell = new AxiosShell();
export default axiosShell;
export { AxiosShell, RequestConfig };
