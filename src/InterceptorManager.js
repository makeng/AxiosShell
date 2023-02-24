/* ---------------------------------------------------------------------------------------
* about:拦截器类。因为是类，所以文件名大些
* author:马兆铿（13790371603 810768333@qq.com）
* date:2020-6-9
* ---------------------------------------------------------------------------------------- */

class InterceptorManager {
  constructor() {
    this.handlers = []
  }

  /**
   * 迭代器
   * @param fn
   */
  forEach(fn) {
    return this.handlers.forEach(fn)
  }

  /**
   * 添加拦截器
   * @param fulfilled Promise 的完成处理函数
   * @param rejected Promise 的失败处理函数
   * @returns {number} id，用于 eject 删除的序号
   */
  use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled,
      rejected
    })

    return this.handlers.length - 1
  }

  /**
   * 删除拦截器
   * @param id 在 handlers 中的序号
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null
    }
  }
}

export default InterceptorManager
