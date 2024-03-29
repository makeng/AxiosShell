/* ---------------------------------------------------------------------------------------
 * about:主文件，导出一个类。更多细节可以参考 Axios 源码。
 * author:马兆铿（810768333@qq.com）
 * date:2020-06-09
 * ---------------------------------------------------------------------------------------- */

import InterceptorManager from './InterceptorManager';
import { deepMerge } from './utils/merge';

type Default = Record<string, any>;

class AxiosShell {
  adapter: (...args: any) => Promise<any>;
  readonly defaults: Default = {};
  interceptors: {
    request: InterceptorManager;
    response: InterceptorManager;
  };

  constructor(instanceConfig: Default = {}) {
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
  create(defaultConfig) {
    const config = deepMerge(this.defaults, { adapter: this.adapter }, defaultConfig);
    return new AxiosShell(config);
  }

  /**
   * 带拦截器的请求
   * @param config
   */
  requestWithInterceptors(config) {
    config = deepMerge(this.defaults, config); // 配置合并
    /**
     * 超时的 Promise
     * @param adapter 请求
     * @param countdown 倒计时
     * @returns {Promise<Awaited<unknown>>}
     */
    const createTimeoutRace = (adapter, countdown) => {
      const createTimeoutPromise = timeout =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const timeoutErrorMessage = `Timeout of ${timeout}ms exceeded`;
            reject({
              status: 408, // 自己根据网络错误码写的，并非真的服务器报的
              message: timeoutErrorMessage,
            });
          }, timeout);
        });
      return Promise.race([adapter, createTimeoutPromise(countdown)]).catch(error => {
        !error.status && (error.status = 500);
        return Promise.reject(error);
      });
    };
    /**
     * 挂接拦截器
     * @param middle 中间的 promise
     * @returns {*[]}
     */
    const createInterceptorsChain = middle => {
      // 需要构建 [fulfilled,rejected,fulfilled,rejected...] 的队列
      const chain = [middle, undefined];

      // 创建请求链数组
      this.interceptors.request.forEach(interceptor => {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
      this.interceptors.response.forEach(interceptor => {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });
      return chain;
    };
    // 核心请求
    const createRequest = () => this.adapter(config);
    // 带上超时
    const { timeout } = config;
    const requestGetData = timeout
      ? () => createTimeoutRace(createRequest(), timeout)
      : createRequest;
    let promise = Promise.resolve(config);
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
['get', 'post', 'head', 'options', 'put', 'delete', 'trace', 'connect'].forEach(method => {
  AxiosShell.prototype[method] = function createRequest(url = '', data = {}, config) {
    const nextConfig = deepMerge(config, { url, data, method });
    return this.requestWithInterceptors(nextConfig);
  };
});

const axiosShell = new AxiosShell();
export default axiosShell;
