/* ---------------------------------------------------------------------------------------
 * about:方法的绑定和处理
 * ---------------------------------------------------------------------------------------- */

import { isObject } from './lib';

/**
 * 方法绑定
 * @param fn
 * @param thisArg
 * @returns {function(): *}
 */
function bind<T extends (...args: unknown[]) => unknown>(fn: T, thisArg: unknown): (...args: Parameters<T>) => ReturnType<T> {
  return function wrap(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    return fn.apply(thisArg as ThisParameterType<T>, args) as ReturnType<T>;
  };
}

/**
 * 深合并
 * @param objList 对象列表
 */
function deepMerge<T extends Record<string, unknown>>(...objList: (T | undefined | null)[]): T {
  const res = {} as T;

  function assignValue(obj: T | undefined | null): void {
    if (!obj) return;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const propValue = obj[key];
        const resValue = res[key];
        // 按照类型选择往下合并还是赋值
        if (isObject(resValue) && isObject(propValue)) {
          res[key] = deepMerge(resValue as Record<string, unknown>, propValue as Record<string, unknown>) as T[Extract<keyof T, string>];
        } else if (isObject(propValue)) {
          res[key] = deepMerge({}, propValue as Record<string, unknown>) as T[Extract<keyof T, string>];
        } else {
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

export { bind, deepMerge };
