/* ---------------------------------------------------------------------------------------
 * about:类型判断和各种基础函数。只增加必要的
 * ---------------------------------------------------------------------------------------- */

const { toString } = Object.prototype;

export function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && toString.call(x) === '[object Object]';
}

export function isArray<T = unknown>(x: unknown): x is T[] {
  return Array.isArray(x);
}

export function isString(x: unknown): x is string {
  return typeof x === 'string';
}

export function isFunction(x: unknown): x is (...args: unknown[]) => unknown {
  return typeof x === 'function';
}

/**
 * 判断是否是普通对象（而非类实例）
 * 用于区分 { foo: 1 } 和 new CancelToken()
 */
export function isPlainObject(x: unknown): x is Record<string, unknown> {
  if (!isObject(x)) return false;

  // 如果有构造函数且构造函数不是 Object，则认为是类实例
  const proto = Object.getPrototypeOf(x);
  if (proto === null) return true; // Object.create(null) 创建的对象

  const Ctor = proto.constructor;
  if (Ctor === undefined) return true;

  return Ctor === Object;
}
