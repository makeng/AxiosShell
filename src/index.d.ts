import InterceptorManager from './InterceptorManager';

type Method = 'get' | 'post' | 'head' | 'options' | 'put' | 'delete' | 'trace' | 'connect';

type AxiosErrorCode =
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

interface AxiosRequestConfig {
  url?: string;
  method?: string;
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  baseURL?: string;
  timeout?: number;
  adapter?: (config: AxiosRequestConfig) => Promise<unknown>;
  validateStatus?: (status: number) => boolean;
}

interface AxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
}

interface AxiosError<T = unknown> extends Error {
  name: 'AxiosError';
  code: AxiosErrorCode | null;
  config: AxiosRequestConfig;
  request?: unknown;
  response?: AxiosResponse<T>;
  cause?: Error;
}

type AxiosRequestHandler<R = unknown> = (url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig) => Promise<R>;

type AxiosRequest = Record<Method, AxiosRequestHandler>;

declare class AxiosShell implements AxiosRequest {
  defaults: AxiosRequestConfig;
  adapter: (config: AxiosRequestConfig) => Promise<unknown>;
  interceptors: Record<'request' | 'response', InterceptorManager>;
  constructor(instanceConfig: AxiosRequestConfig);
  create(defaultConfig: AxiosRequestConfig): AxiosShell;
  get<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
  post<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
  head<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
  options<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
  put<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
  delete<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
  trace<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
  connect<R>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<R>;
}

declare const axiosShell: AxiosShell;

// AxiosError 静态方法
declare namespace AxiosError {
  function isAxiosError<T = unknown>(payload: unknown): payload is AxiosError<T>;
}

export default axiosShell;
export { AxiosShell, AxiosRequestConfig, AxiosResponse, AxiosError, AxiosErrorCode };
