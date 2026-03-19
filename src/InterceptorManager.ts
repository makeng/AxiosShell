/* ---------------------------------------------------------------------------------------
 * about:拦截器类。因为是类，所以文件名大些
 * ---------------------------------------------------------------------------------------- */

type HandleProcess = ((params: unknown) => unknown) | null;

class InterceptorManager {
  handlers: (Record<'fulfilled' | 'rejected', HandleProcess> | null)[];
  constructor() {
    this.handlers = [];
  }

  /**
   * 迭代器
   * @param fn
   */
  forEach(fn: (h: Record<'fulfilled' | 'rejected', HandleProcess>) => void) {
    this.handlers.forEach(function(h) {
      if (h) {
        fn(h);
      }
    });
  }

  /**
   * 添加拦截器
   */
  use(fulfilled: HandleProcess = null, rejected: HandleProcess = null) {
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
