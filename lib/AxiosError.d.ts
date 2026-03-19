import { RequestConfig } from './index';
type AxiosErrorCode = 'ERR_BAD_OPTION_VALUE' | 'ERR_BAD_OPTION' | 'ECONNABORTED' | 'ETIMEDOUT' | 'ERR_NETWORK' | 'ERR_FR_TOO_MANY_REDIRECTS' | 'ERR_DEPRECATED' | 'ERR_BAD_RESPONSE' | 'ERR_BAD_REQUEST' | 'ERR_CANCELED' | 'ERR_NOT_SUPPORT' | 'ERR_INVALID_URL';
interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: RequestConfig;
}
declare class AxiosError<T = unknown> extends Error {
    code: AxiosErrorCode | null;
    config: RequestConfig;
    request?: unknown;
    response?: AxiosResponse<T>;
    cause?: Error;
    constructor(message: string, code: AxiosErrorCode | null, config: RequestConfig, request?: unknown, response?: AxiosResponse<T>, cause?: Error);
    /**
     * 判断是否为 AxiosError
     */
    static isAxiosError<T = unknown>(payload: unknown): payload is AxiosError<T>;
    /**
     * 创建超时错误
     */
    static createTimeoutError(timeout: number, config: RequestConfig, request?: unknown): AxiosError;
    /**
     * 创建网络错误
     */
    static createNetworkError(message: string, config: RequestConfig, request?: unknown, cause?: Error): AxiosError;
    /**
     * 创建响应错误（HTTP 错误状态码）
     */
    static createResponseError<T>(message: string, config: RequestConfig, request: unknown, response: AxiosResponse<T>): AxiosError<T>;
    /**
     * 创建请求错误
     */
    static createRequestError(message: string, config: RequestConfig, request?: unknown, cause?: Error): AxiosError;
}
export { AxiosError, AxiosErrorCode, AxiosResponse };
