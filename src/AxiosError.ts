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

// 构造函数选项
export interface AxiosErrorOptions<T = unknown> {
  code: AxiosErrorCode | null;
  config: RequestConfig;
  request?: unknown;
  response?: AxiosResponse<T>;
  cause?: unknown;
}

/**
 * Axios 风格的错误类
 * - 使用 Options 对象构造（2024-2026 TS 标准）
 * - 利用原生 ES2022 cause 支持错误链
 */
export class AxiosError<T = unknown> extends Error {
  code: AxiosErrorCode | null;
  config: RequestConfig;
  request?: unknown;
  response?: AxiosResponse<T>;

  constructor(message: string, options: AxiosErrorOptions<T>) {
    // ES2022 原生 Error cause 支持，Chrome DevTools 可见完整错误链
    super(message, { cause: options.cause });
    this.name = 'AxiosError';
    this.code = options.code;
    this.config = options.config;
    this.request = options.request;
    this.response = options.response;

    // 确保 instanceof 正常工作
    Object.setPrototypeOf(this, AxiosError.prototype);
  }

  /**
   * 类型守卫：判断是否为 AxiosError
   */
  static isAxiosError<T = unknown>(payload: unknown): payload is AxiosError<T> {
    return payload instanceof AxiosError || (
      typeof payload === 'object' &&
      payload !== null &&
      (payload as Record<string, unknown>).name === 'AxiosError'
    );
  }
}
