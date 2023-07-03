/* ---------------------------------------------------------------------------------------
 * about:类型判断
 * author:马兆铿（13790371603 810768333@qq.com）
 * date:2020-6-9
 * ---------------------------------------------------------------------------------------- */

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

export { isObject, isArray, isString, isFunction };
