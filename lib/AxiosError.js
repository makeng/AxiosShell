"use strict";
/* ---------------------------------------------------------------------------------------
 * about:Axios 风格的错误类封装
 * ---------------------------------------------------------------------------------------- */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosError = void 0;
class AxiosError extends Error {
    constructor(message, code, config, request, response, cause) {
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
    static isAxiosError(payload) {
        return payload instanceof AxiosError || (typeof payload === 'object' &&
            payload !== null &&
            payload.name === 'AxiosError');
    }
    /**
     * 创建超时错误
     */
    static createTimeoutError(timeout, config, request) {
        const message = `timeout of ${timeout}ms exceeded`;
        return new AxiosError(message, 'ECONNABORTED', config, request, undefined);
    }
    /**
     * 创建网络错误
     */
    static createNetworkError(message, config, request, cause) {
        return new AxiosError(message, 'ERR_NETWORK', config, request, undefined, cause);
    }
    /**
     * 创建响应错误（HTTP 错误状态码）
     */
    static createResponseError(message, config, request, response) {
        return new AxiosError(message, 'ERR_BAD_RESPONSE', config, request, response);
    }
    /**
     * 创建请求错误
     */
    static createRequestError(message, config, request, cause) {
        return new AxiosError(message, 'ERR_BAD_REQUEST', config, request, undefined, cause);
    }
}
exports.AxiosError = AxiosError;
//# sourceMappingURL=AxiosError.js.map