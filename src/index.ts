/* ---------------------------------------------------------------------------------------
 * about:主文件，导出一个类。更多细节可以参考 Axios 源码。
 * ---------------------------------------------------------------------------------------- */

import InterceptorManager, { InterceptorHandler } from '@/InterceptorManager';
import { deepMerge } from '@/utils/merge';
import { AxiosError, AxiosResponse } from '@/AxiosError';
import { RequestConfig, ValidateStatus } from '@/types';
import { CancelToken } from '@/CancelToken';

export class AxiosShell {
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
   * 默认状态码验证：2xx 视为成功
   */
  private static defaultValidateStatus(status: number): boolean {
    return status >= 200 && status < 300;
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
    const { cancelToken, signal } = mergedConfig;

    // 检查是否已取消
    if (cancelToken) {
      cancelToken.throwIfRequested();
    }

    const createTimeoutRace = (adapterPromise: Promise<unknown>, countdown: number) => {
      const createTimeoutPromise = (timeout: number) =>
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutError = AxiosError.createTimeoutError(timeout, mergedConfig);
            reject(timeoutError);
          }, timeout);
        });
      return Promise.race([adapterPromise, createTimeoutPromise(countdown)]);
    };

    const createCancelRace = (adapterPromise: Promise<unknown>) => {
      if (!cancelToken) {
        return adapterPromise;
      }

      const cancelPromise = new Promise<never>((_, reject) => {
        cancelToken.subscribe((cancelError) => {
          reject(cancelError);
        });
      });

      return Promise.race([adapterPromise, cancelPromise]);
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

    // 核心请求，使用 AxiosError 封装错误
    const createRequest = () => {
      // 将 signal 传递给 adapter（如果支持）
      if (signal && !mergedConfig.signal) {
        mergedConfig.signal = signal;
      }
      // 如果 cancelToken 有 AbortSignal，也传递给 adapter
      if (cancelToken?.signal && !mergedConfig.signal) {
        mergedConfig.signal = cancelToken.signal;
      }

      return this.adapter(mergedConfig).then(response => {
        // 请求完成后检查是否已取消（防止竞态）
        if (cancelToken?.isCancelled) {
          throw cancelToken.reason!;
        }

        // 将响应包装为 AxiosResponse 格式
        let axiosResponse: AxiosResponse;

        if (typeof response === 'object' && response !== null) {
          const responseObj = response as Record<string, unknown>;
          axiosResponse = {
            data: responseObj.data ?? response,
            status: (responseObj.status as number) ?? 200,
            statusText: (responseObj.statusText as string) ?? 'OK',
            headers: (responseObj.headers as Record<string, string>) ?? {},
            config: mergedConfig,
          };
        } else {
          axiosResponse = {
            data: response,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: mergedConfig,
          };
        }

        // 验证状态码
        const validateStatus = mergedConfig.validateStatus ?? AxiosShell.defaultValidateStatus;
        if (!validateStatus(axiosResponse.status)) {
          throw AxiosError.createResponseError(
            `Request failed with status code ${axiosResponse.status}`,
            mergedConfig,
            undefined,
            axiosResponse
          );
        }

        return axiosResponse;
      }).catch(error => {
        // 如果已经是 AxiosError，直接抛出
        if (AxiosError.isAxiosError(error)) {
          return Promise.reject(error);
        }

        // 将普通错误转换为 AxiosError
        const axiosError = AxiosError.createNetworkError(
          error instanceof Error ? error.message : 'Network Error',
          mergedConfig,
          undefined,
          error instanceof Error ? error : undefined
        );
        return Promise.reject(axiosError);
      });
    };

    const { timeout } = mergedConfig;
    let requestGetData = createRequest;

    // 添加超时竞速
    if (timeout) {
      const originalRequest = requestGetData;
      requestGetData = () => createTimeoutRace(originalRequest(), timeout as number);
    }

    // 添加取消竞速
    if (cancelToken) {
      const originalRequest = requestGetData;
      requestGetData = () => createCancelRace(originalRequest());
    }

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
export { RequestConfig, ValidateStatus } from '@/types';
export { AxiosError, AxiosResponse } from '@/AxiosError';
export { CancelToken } from '@/CancelToken';
