/* ---------------------------------------------------------------------------------------
 * about:取消令牌，支持请求取消功能
 * ---------------------------------------------------------------------------------------- */

import { RequestConfig } from '@/types';
import { AxiosError } from '@/AxiosError';

// 取消器接口
export interface CancelExecutor {
  (message?: string): void;
}

// 取消源接口
export interface CancelSource {
  token: CancelToken;
  cancel: CancelExecutor;
}

// 取消监听器
type CancelListener = (cancel: AxiosError) => void;

/**
 * CancelToken 类
 * - 支持软取消：忽略响应、抛出取消错误
 * - 支持 AbortController 集成（如果环境支持）
 */
export class CancelToken {
  private _reason: AxiosError | null = null;
  private _listeners: CancelListener[] = [];
  private _abortController: AbortController | null = null;

  constructor(executor: CancelExecutor) {
    let resolvePromise: (cancel: AxiosError) => void;

    // 创建一个 Promise，在取消时 resolve
    const promise = new Promise<AxiosError>(resolve => {
      resolvePromise = resolve;
    });

    // 尝试创建 AbortController（如果环境支持）
    if (typeof AbortController !== 'undefined') {
      this._abortController = new AbortController();
    }

    // 执行取消器，传入取消回调
    executor(message => {
      if (this._reason) {
        // 已经取消过了
        return;
      }

      // 创建取消错误
      this._reason = AxiosError.createCancelError(
        message || 'Request canceled',
        {} as RequestConfig
      );

      // 触发 AbortController
      if (this._abortController) {
        this._abortController.abort();
      }

      // 通知所有监听器
      this._listeners.forEach(listener => listener(this._reason!));

      // resolve Promise
      resolvePromise(this._reason);
    });
  }

  /**
   * 获取取消原因
   */
  get reason(): AxiosError | null {
    return this._reason;
  }

  /**
   * 判断是否已取消
   */
  get isCancelled(): boolean {
    return this._reason !== null;
  }

  /**
   * 获取 AbortSignal（如果支持）
   */
  get signal(): AbortSignal | null {
    return this._abortController?.signal ?? null;
  }

  /**
   * 订阅取消事件
   */
  subscribe(listener: CancelListener): () => void {
    this._listeners.push(listener);

    // 如果已经取消，立即触发
    if (this._reason) {
      listener(this._reason);
    }

    // 返回取消订阅函数
    return () => {
      const index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    };
  }

  /**
   * 如果已取消，抛出取消错误
   */
  throwIfRequested(): void {
    if (this._reason) {
      throw this._reason;
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
    let cancel: CancelExecutor;

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
