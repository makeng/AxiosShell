declare function isObject(x: unknown): x is Record<string, unknown>;
declare function isArray<T = unknown>(x: unknown): x is T[];
declare function isString(x: unknown): x is string;
declare function isFunction(x: unknown): x is (...args: unknown[]) => unknown;
export { isObject, isArray, isString, isFunction };
