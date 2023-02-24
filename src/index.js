/* ---------------------------------------------------------------------------------------
* about:主文件，导出一个类。更多细节可以参考 Axios 源码。
* author:马兆铿（810768333@qq.com）
* date:2020-06-09
* ---------------------------------------------------------------------------------------- */

import Interceptor from './Interceptor'
import { deepMerge } from './utils/merge'

class AxiosLike {
  constructor(instanceConfig = {}) {
    const { request } = instanceConfig

    this.defaults = instanceConfig
    // 一定要传入实际请求的方法
    if (request) {
      this.request = request
    }
    // 拦截器桥接
    this.interceptors = {
      request: new Interceptor(),
      response: new Interceptor()
    }
  }

  /**
   * 创建
   * @param defaultConfig 默认配置
   * @returns {AxiosLike}
   */
  create(defaultConfig) {
    const config = deepMerge(this.defaults, { request: this.request }, defaultConfig)
    return new AxiosLike(config)
  }

  /**
   * 带拦截器的请求
   * @private
   */
  _requestWithInterceptors(config) {
    config = deepMerge(this.defaults, config) // 配置合并
    // 挂接拦截器
    const createInterceptorsChain = request => {
      // 需要构建 [fulfilled,rejected,fulfilled,rejected...] 的队列
      const chain = [request, undefined]

      // 创建请求链数组
      this.interceptors.request.forEach(interceptor => {
        chain.unshift(interceptor.fulfilled, interceptor.rejected)
      })
      this.interceptors.response.forEach(interceptor => {
        chain.push(interceptor.fulfilled, interceptor.rejected)
      })
      return chain
    }
    // 超时的 Promise
    const createTimeoutRace = (request, timeout) => {
      const createTimeoutPromise = timeout => new Promise((resolve, reject) => {
        setTimeout(() => {
          let timeoutErrorMessage = 'timeout of ' + timeout + 'ms exceeded'
          reject({
            status: 408, // 自己根据网络错误码写的，并非真的服务器报的
            message: timeoutErrorMessage
          })
        }, timeout)
      })
      return Promise.race([request, createTimeoutPromise(timeout)]).catch(err => {
        console.error(err)
        return err
      })
    }

    // 核心请求
    let createRequest = () => this.request(config).then(res => {
      return { // TODO:增加自定义的网络状态和信息
        data: res,
        status: 0,
        message: ''
      }
    })
    // 带上超时
    const { timeout } = config
    const requestGetData = timeout
      ? () => createTimeoutRace(createRequest(), timeout)
      : createRequest
    // 链式请求生成
    const chain = createInterceptorsChain(requestGetData)
    // 请求链执行
    let promise = Promise.resolve(config)
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }
    return promise
  }
}

// 增加请求方法
['get', 'post', 'head', 'options', 'put', 'delete', 'trace', 'connect'].forEach(method => {
  /**
   * 创建一个请求，带有默认参数，并设置请求方法
   * @param url
   * @param data
   * @param config
   * @returns {Promise<{}>}
   */
  function createRequest(url = '', data = {}, config) {
    const nextConfig = deepMerge(config, { url, data, method })
    return this._requestWithInterceptors(nextConfig)
  }
  AxiosLike.prototype[method] = createRequest()
})

const axiosLike = new AxiosLike()

export default axiosLike
