"use strict";
/* ---------------------------------------------------------------------------------------
 * about:拦截器类。因为是类，所以文件名大些
 * ---------------------------------------------------------------------------------------- */
Object.defineProperty(exports, "__esModule", { value: true });
class InterceptorManager {
    constructor() {
        this.handlers = [];
    }
    /**
     * 迭代器
     * @param fn
     */
    forEach(fn) {
        this.handlers.forEach(function (h) {
            if (h) {
                fn(h);
            }
        });
    }
    /**
     * 添加拦截器
     */
    use(fulfilled = null, rejected = null) {
        this.handlers.push({
            fulfilled,
            rejected,
        });
        return this.handlers.length - 1;
    }
    /**
     * 删除拦截器
     * @param id 在 handlers 中的序号
     */
    eject(id) {
        if (this.handlers[id]) {
            this.handlers[id] = null;
        }
    }
    /**
     * 清空拦截器
     */
    clear() {
        this.handlers = [];
    }
}
exports.default = InterceptorManager;
//# sourceMappingURL=InterceptorManager.js.map