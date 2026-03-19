/**
 * 方法绑定
 * @param fn
 * @param thisArg
 * @returns {function(): *}
 */
declare function bind<T extends (...args: unknown[]) => unknown>(fn: T, thisArg: unknown): (...args: Parameters<T>) => ReturnType<T>;
/**
 * 深合并
 * @param objList 对象列表
 */
declare function deepMerge<T extends Record<string, unknown>>(...objList: (T | undefined | null)[]): T;
export { bind, deepMerge };
