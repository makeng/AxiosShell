/* ---------------------------------------------------------------------------------------
 * about:拦截器类。因为是类，所以文件名大些
 * author:马兆铿（13790371603 810768333@qq.com）
 * date:2020-6-9
 * ---------------------------------------------------------------------------------------- */

type handleProcess = ((parmas: any) => any) | null;

class InterceptorManager {
  handlers: (Record<'fulfilled' | 'rejected', handleProcess> | null)[];
  constructor() {
    this.handlers = [];
  }

  /**
   * 迭代器
   * @param fn
   */
  forEach(fn) {
    this.handlers.forEach(function(h) {
      if (h) {
        fn(h);
      }
    });
  }

  /**
   * 添加拦截器
   */
  use(fulfilled: handleProcess = null, rejected: handleProcess = null) {
    this.handlers.push({
      fulfilled,
      rejected,
    });

    return this.handlers.length - 1;
  }

  /**
   * 删除拦截器
   * @param id 在 handlers 中的序号
   */
  eject(id: number) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * 清空拦截器
   */
  clear() {
    this.handlers = [];
  }
}

export default InterceptorManager;
