"use strict";
/* ---------------------------------------------------------------------------------------
 * about:方法的绑定和处理
 * ---------------------------------------------------------------------------------------- */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bind = bind;
exports.deepMerge = deepMerge;
const lib_1 = require("./lib");
/**
 * 方法绑定
 * @param fn
 * @param thisArg
 * @returns {function(): *}
 */
function bind(fn, thisArg) {
    return function wrap(...args) {
        return fn.apply(thisArg, args);
    };
}
/**
 * 深合并
 * @param objList 对象列表
 */
function deepMerge(...objList) {
    const res = {};
    function assignValue(obj) {
        if (!obj)
            return;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const propValue = obj[key];
                const resValue = res[key];
                // 按照类型选择往下合并还是赋值
                if ((0, lib_1.isObject)(resValue) && (0, lib_1.isObject)(propValue)) {
                    res[key] = deepMerge(resValue, propValue);
                }
                else if ((0, lib_1.isObject)(propValue)) {
                    res[key] = deepMerge({}, propValue);
                }
                else {
                    res[key] = propValue;
                }
            }
        }
    }
    for (const obj of objList) {
        assignValue(obj);
    }
    return res;
}
//# sourceMappingURL=merge.js.map