/* ---------------------------------------------------------------------------------------
 * about:拦截器类。因为是类，所以文件名大些
 * ---------------------------------------------------------------------------------------- */

export interface InterceptorHandler<V = unknown> {
  fulfilled: ((value: V) => V | Promise<V>) | null;
  rejected: ((error: unknown) => unknown) | null;
}

export default class InterceptorManager<V = unknown> {
  handlers: (InterceptorHandler<V> | null)[];

  constructor() {
    this.handlers = [];
  }

  /**
   * 迭代器
   * @param fn
   */
  forEach(fn: (h: InterceptorHandler<V>) => void): void {
    this.handlers.forEach(function(h) {
      if (h) {
        fn(h);
      }
    });
  }

  /**
   * 添加拦截器
   */
  use(fulfilled: ((value: V) => V | Promise<V>) | null = null, rejected: ((error: unknown) => unknown) | null = null): number {
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
  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * 清空拦截器
   */
  clear(): void {
    this.handlers = [];
  }
}
