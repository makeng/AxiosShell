import InterceptorManager from './InterceptorManager';
import { AxiosError, AxiosResponse } from './AxiosError';
type ValidateStatus = (status: number) => boolean;
interface RequestConfig extends Record<string, unknown> {
    url?: string;
    method?: string;
    data?: Record<string, unknown>;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    baseURL?: string;
    timeout?: number;
    adapter?: (config: RequestConfig) => Promise<unknown>;
    validateStatus?: ValidateStatus;
}
declare class AxiosShell {
    adapter: (config: RequestConfig) => Promise<unknown>;
    readonly defaults: RequestConfig;
    interceptors: {
        request: InterceptorManager<RequestConfig>;
        response: InterceptorManager<unknown>;
    };
    get: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    post: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    head: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    options: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    put: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    delete: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    trace: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    connect: (url?: string, data?: Record<string, unknown>, config?: RequestConfig) => Promise<unknown>;
    constructor(instanceConfig?: RequestConfig);
    /**
     * 默认状态码验证：2xx 视为成功
     */
    private static defaultValidateStatus;
    /**
     * 创建
     * @param defaultConfig 默认配置
     * @returns {AxiosShell}
     */
    create(defaultConfig: RequestConfig): AxiosShell;
    /**
     * 带拦截器的请求
     * @param config
     */
    requestWithInterceptors(config: RequestConfig): Promise<unknown>;
}
declare const axiosShell: AxiosShell;
export default axiosShell;
export { AxiosShell, RequestConfig, AxiosError, AxiosResponse, ValidateStatus };
