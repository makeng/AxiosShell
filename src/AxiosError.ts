/* ---------------------------------------------------------------------------------------
 * about:Axios 风格的错误类封装
 * ---------------------------------------------------------------------------------------- */

import { RequestConfig } from '@/types';

// 错误码枚举
export type AxiosErrorCode =
  | 'ERR_BAD_OPTION_VALUE'
  | 'ERR_BAD_OPTION'
  | 'ECONNABORTED'
  | 'ETIMEDOUT'
  | 'ERR_NETWORK'
  | 'ERR_FR_TOO_MANY_REDIRECTS'
  | 'ERR_DEPRECATED'
  | 'ERR_BAD_RESPONSE'
  | 'ERR_BAD_REQUEST'
  | 'ERR_CANCELED'
  | 'ERR_NOT_SUPPORT'
  | 'ERR_INVALID_URL';

// 响应数据结构
export interface AxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export class AxiosError<T = unknown> extends Error {
  code: AxiosErrorCode | null;
  config: RequestConfig;
  request?: unknown;
  response?: AxiosResponse<T>;
  cause?: Error;

  constructor(
    message: string,
    code: AxiosErrorCode | null,
    config: RequestConfig,
    request?: unknown,
    response?: AxiosResponse<T>,
    cause?: Error
  ) {
    super(message);
    this.name = 'AxiosError';
    this.code = code;
    this.config = config;
    this.request = request;
    this.response = response;
    this.cause = cause;

    // 确保 instanceof 正常工作
    Object.setPrototypeOf(this, AxiosError.prototype);
  }

  /**
   * 判断是否为 AxiosError
   */
  static isAxiosError<T = unknown>(payload: unknown): payload is AxiosError<T> {
    return payload instanceof AxiosError || (
      typeof payload === 'object' &&
      payload !== null &&
      (payload as Record<string, unknown>).name === 'AxiosError'
    );
  }

  /**
   * 创建超时错误
   */
  static createTimeoutError(timeout: number, config: RequestConfig, request?: unknown): AxiosError {
    const message = `timeout of ${timeout}ms exceeded`;
    return new AxiosError(message, 'ECONNABORTED', config, request, undefined);
  }

  /**
   * 创建网络错误
   */
  static createNetworkError(message: string, config: RequestConfig, request?: unknown, cause?: Error): AxiosError {
    return new AxiosError(message, 'ERR_NETWORK', config, request, undefined, cause);
  }

  /**
   * 创建响应错误（HTTP 错误状态码）
   */
  static createResponseError<T>(
    message: string,
    config: RequestConfig,
    request: unknown,
    response: AxiosResponse<T>
  ): AxiosError<T> {
    return new AxiosError(message, 'ERR_BAD_RESPONSE', config, request, response);
  }

  /**
   * 创建请求错误
   */
  static createRequestError(message: string, config: RequestConfig, request?: unknown, cause?: Error): AxiosError {
    return new AxiosError(message, 'ERR_BAD_REQUEST', config, request, undefined, cause);
  }

  /**
   * 创建取消错误
   */
  static createCancelError(message: string, config: RequestConfig, request?: unknown): AxiosError {
    return new AxiosError(message, 'ERR_CANCELED', config, request);
  }
}
