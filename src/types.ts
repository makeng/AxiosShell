/* ---------------------------------------------------------------------------------------
 * about:共享类型定义
 * ---------------------------------------------------------------------------------------- */

import type { CancelToken } from '@/CancelToken';

// 状态码验证函数类型
export type ValidateStatus = (status: number) => boolean;

// 请求配置接口
export interface RequestConfig extends Record<string, unknown> {
  url?: string;
  method?: string;
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  baseURL?: string;
  timeout?: number;
  adapter?: (config: RequestConfig) => Promise<unknown>;
  validateStatus?: ValidateStatus;
  // 取消相关
  cancelToken?: CancelToken;
  signal?: AbortSignal;
}
