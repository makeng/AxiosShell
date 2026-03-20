/* ---------------------------------------------------------------------------------------
 * about:方法的绑定和处理
 * ---------------------------------------------------------------------------------------- */

import { isPlainObject } from '@/utils/lib'

/**
 * 深合并
 * @param objList 对象列表
 */
export function deepMerge<T extends Record<string, unknown>>(...objList: (T | undefined | null)[]): T {
  const res = {} as T

  function assignValue(obj: T | undefined | null): void {
    if (!obj) return
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const propValue = obj[key]
        const resValue = res[key]
        // 只有普通对象才进行深度合并，类实例直接引用
        if (isPlainObject(resValue) && isPlainObject(propValue)) {
          res[key] = deepMerge(resValue, propValue as Record<string, unknown>) as T[Extract<keyof T, string>]
        } else if (isPlainObject(propValue)) {
          res[key] = deepMerge({} as Record<string, unknown>, propValue) as T[Extract<keyof T, string>]
        } else {
          res[key] = propValue
        }
      }
    }
  }

  for (const obj of objList) {
    assignValue(obj)
  }
  return res
}
