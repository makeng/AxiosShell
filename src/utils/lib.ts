/* ---------------------------------------------------------------------------------------
 * about:类型判断和各种基础函数。只增加必要的
 * ---------------------------------------------------------------------------------------- */

const { toString } = Object.prototype;

export function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && toString.call(x) === '[object Object]';
}

export function isArray<T = unknown>(x: unknown): x is T[] {
  return toString.call(x) === '[object Array]';
}

export function isString(x: unknown): x is string {
  return !!x && toString.call(x) === '[object String]';
}

export function isFunction(x: unknown): x is (...args: unknown[]) => unknown {
  return toString.call(x) === '[object Function]';
}
