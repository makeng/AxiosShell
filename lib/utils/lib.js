"use strict";
/* ---------------------------------------------------------------------------------------
 * about:类型判断和各种基础函数。只增加必要的
 * ---------------------------------------------------------------------------------------- */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = isObject;
exports.isArray = isArray;
exports.isString = isString;
exports.isFunction = isFunction;
const { toString } = Object.prototype;
function isObject(x) {
    return !!x && toString.call(x) === '[object Object]';
}
function isArray(x) {
    return toString.call(x) === '[object Array]';
}
function isString(x) {
    return !!x && toString.call(x) === '[object String]';
}
function isFunction(x) {
    return toString.call(x) === '[object Function]';
}
//# sourceMappingURL=lib.js.map