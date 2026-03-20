/* ---------------------------------------------------------------------------------------
 * about:取消令牌，支持请求取消功能
 * ---------------------------------------------------------------------------------------- */

import { RequestConfig } from '@/types';
import { AxiosError } from '@/AxiosError';

// 取消回调函数（用户调用以取消请求）
export type Cancel = (message?: string) => void;

// 取消器执行函数（构造函数参数）
export type CancelExecutor = (cancel: Cancel) => void;

// 取消源接口
export interface CancelSource {
  token: CancelToken;
  cancel: Cancel;
}

// 取消监听器
type CancelListener = (cancel: AxiosError) => void;

/**
 * CancelToken 类
 * - 支持软取消：忽略响应、抛出取消错误
 * - 支持 AbortController 集成（如果环境支持）
 */
export class CancelToken {
  #reason: AxiosError | null = null;
  #listeners: CancelListener[] = [];
  #abortController: AbortController | null = null;

  constructor(executor: CancelExecutor) {
    let resolvePromise: (cancel: AxiosError) => void;

    // 创建一个 Promise，在取消时 resolve
    const promise = new Promise<AxiosError>(resolve => {
      resolvePromise = resolve;
    });

    // 尝试创建 AbortController（如果环境支持）
    if (typeof AbortController !== 'undefined') {
      this.#abortController = new AbortController();
    }

    // 执行取消器，传入取消回调
    executor((message?: string) => {
      if (this.#reason) {
        // 已经取消过了
        return;
      }

      // 创建取消错误
      this.#reason = new AxiosError(
        message || 'Request canceled',
        { code: 'ERR_CANCELED', config: {} as RequestConfig }
      );

      // 触发 AbortController
      this.#abortController?.abort();

      // 通知所有监听器
      this.#listeners.forEach(listener => listener(this.#reason!));

      // resolve Promise
      resolvePromise(this.#reason);
    });
  }

  /**
   * 获取取消原因
   */
  get reason(): AxiosError | null {
    return this.#reason;
  }

  /**
   * 判断是否已取消
   */
  get isCancelled(): boolean {
    return this.#reason !== null;
  }

  /**
   * 获取 AbortSignal（如果支持）
   */
  get signal(): AbortSignal | null {
    return this.#abortController?.signal ?? null;
  }

  /**
   * 订阅取消事件
   */
  subscribe(listener: CancelListener): () => void {
    this.#listeners.push(listener);

    // 如果已经取消，立即触发
    if (this.#reason) {
      listener(this.#reason);
    }

    // 返回取消订阅函数
    return () => {
      const index = this.#listeners.indexOf(listener);
      if (index !== -1) {
        this.#listeners.splice(index, 1);
      }
    };
  }

  /**
   * 如果已取消，抛出取消错误
   */
  throwIfRequested(): void {
    if (this.#reason) {
      throw this.#reason;
    }
  }

  /**
   * 创建取消源（Axios 风格）
   * @example
   * const source = CancelToken.source();
   * instance.get('/users', { cancelToken: source.token });
   * source.cancel('Operation canceled by user');
   */
  static source(): CancelSource {
    let cancel: Cancel | undefined;

    const token = new CancelToken(c => {
      cancel = c;
    });

    return {
      token,
      cancel: cancel!,
    };
  }

  /**
   * 从 AbortController 创建 CancelToken
   * @example
   * const controller = new AbortController();
   * const token = CancelToken.fromAbortController(controller);
   * instance.get('/users', { cancelToken: token });
   * controller.abort();
   */
  static fromAbortController(controller: AbortController): CancelToken {
    return new CancelToken(message => {
      controller.abort(message);
    });
  }
}
