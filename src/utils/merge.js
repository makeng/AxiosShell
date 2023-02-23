/* ---------------------------------------------------------------------------------------
* about:方法的绑定和处理
* author:马兆铿（13790371603 810768333@qq.com）
* date:2020-06-09
* ---------------------------------------------------------------------------------------- */

import { isObject } from './type'

/**
 * 方法绑定
 * @param fn
 * @param thisArg
 * @returns {function(): *}
 */
function bind (fn, thisArg) {
  return function wrap () {
    const args = new Array(arguments.length)
    for (let i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    return fn.apply(thisArg, args)
  }
}

/**
 * 深合并
 * @param objList 对象列表
 */
function deepMerge (...objList) {
  const res = {}

  function assignValue (obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const propValue = obj[key]
        // 按照类型选择往下合并还是赋值
        if (isObject(res[key]) && isObject(propValue)) {
          res[key] = deepMerge(res[key], propValue)
        } else if (isObject(propValue)) {
          res[key] = deepMerge({}, propValue)
        } else {
          res[key] = propValue
        }
      }
    }
  }

  for (let obj of objList) {
    assignValue(obj)
  }
  return res
}

export {
  bind,
  deepMerge
}
