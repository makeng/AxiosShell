"use strict";
/* ---------------------------------------------------------------------------------------
 * about:主文件，导出一个类。更多细节可以参考 Axios 源码。
 * ---------------------------------------------------------------------------------------- */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosError = exports.AxiosShell = void 0;
const InterceptorManager_1 = require("./InterceptorManager");
const merge_1 = require("./utils/merge");
const AxiosError_1 = require("./AxiosError");
Object.defineProperty(exports, "AxiosError", { enumerable: true, get: function () { return AxiosError_1.AxiosError; } });
class AxiosShell {
    constructor(instanceConfig = {}) {
        this.defaults = {};
        const { adapter } = instanceConfig;
        this.defaults = instanceConfig;
        // 一定要传入实际请求的方法
        if (adapter) {
            this.adapter = adapter;
        }
        // 拦截器桥接
        this.interceptors = {
            request: new InterceptorManager_1.default(),
            response: new InterceptorManager_1.default(),
        };
    }
    /**
     * 默认状态码验证：2xx 视为成功
     */
    static defaultValidateStatus(status) {
        return status >= 200 && status < 300;
    }
    /**
     * 创建
     * @param defaultConfig 默认配置
     * @returns {AxiosShell}
     */
    create(defaultConfig) {
        const config = (0, merge_1.deepMerge)(this.defaults, { adapter: this.adapter }, defaultConfig);
        return new AxiosShell(config);
    }
    /**
     * 带拦截器的请求
     * @param config
     */
    requestWithInterceptors(config) {
        const mergedConfig = (0, merge_1.deepMerge)(this.defaults, config);
        const createTimeoutRace = (adapterPromise, countdown) => {
            const createTimeoutPromise = (timeout) => new Promise((_, reject) => {
                setTimeout(() => {
                    const timeoutError = AxiosError_1.AxiosError.createTimeoutError(timeout, mergedConfig);
                    reject(timeoutError);
                }, timeout);
            });
            return Promise.race([adapterPromise, createTimeoutPromise(countdown)]);
        };
        const createInterceptorsChain = (middle) => {
            const chain = [middle, undefined];
            // 请求拦截器：后添加的先执行
            this.interceptors.request.forEach((interceptor) => {
                chain.unshift(interceptor.fulfilled, interceptor.rejected);
            });
            // 响应拦截器：按添加顺序执行
            this.interceptors.response.forEach((interceptor) => {
                chain.push(interceptor.fulfilled, interceptor.rejected);
            });
            return chain;
        };
        // 核心请求，使用 AxiosError 封装错误
        const createRequest = () => this.adapter(mergedConfig).then(response => {
            var _a, _b, _c, _d, _e;
            // 将响应包装为 AxiosResponse 格式
            let axiosResponse;
            if (typeof response === 'object' && response !== null) {
                const responseObj = response;
                axiosResponse = {
                    data: (_a = responseObj.data) !== null && _a !== void 0 ? _a : response,
                    status: (_b = responseObj.status) !== null && _b !== void 0 ? _b : 200,
                    statusText: (_c = responseObj.statusText) !== null && _c !== void 0 ? _c : 'OK',
                    headers: (_d = responseObj.headers) !== null && _d !== void 0 ? _d : {},
                    config: mergedConfig,
                };
            }
            else {
                axiosResponse = {
                    data: response,
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: mergedConfig,
                };
            }
            // 验证状态码
            const validateStatus = (_e = mergedConfig.validateStatus) !== null && _e !== void 0 ? _e : AxiosShell.defaultValidateStatus;
            if (!validateStatus(axiosResponse.status)) {
                throw AxiosError_1.AxiosError.createResponseError(`Request failed with status code ${axiosResponse.status}`, mergedConfig, undefined, axiosResponse);
            }
            return axiosResponse;
        }).catch(error => {
            // 如果已经是 AxiosError，直接抛出
            if (AxiosError_1.AxiosError.isAxiosError(error)) {
                return Promise.reject(error);
            }
            // 将普通错误转换为 AxiosError
            const axiosError = AxiosError_1.AxiosError.createNetworkError(error instanceof Error ? error.message : 'Network Error', mergedConfig, undefined, error instanceof Error ? error : undefined);
            return Promise.reject(axiosError);
        });
        const { timeout } = mergedConfig;
        const requestGetData = timeout
            ? () => createTimeoutRace(createRequest(), timeout)
            : createRequest;
        let promise = Promise.resolve(mergedConfig);
        const chain = createInterceptorsChain(requestGetData);
        while (chain.length) {
            promise = promise.then(chain.shift(), chain.shift());
        }
        return promise;
    }
}
exports.AxiosShell = AxiosShell;
// 增加请求方法
const httpMethods = ['get', 'post', 'head', 'options', 'put', 'delete', 'trace', 'connect'];
httpMethods.forEach(method => {
    AxiosShell.prototype[method] = function createRequest(url = '', data = {}, config) {
        const nextConfig = (0, merge_1.deepMerge)(config, { url, data, method });
        return this.requestWithInterceptors(nextConfig);
    };
});
const axiosShell = new AxiosShell();
exports.default = axiosShell;
//# sourceMappingURL=index.js.map