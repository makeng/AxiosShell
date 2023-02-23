/* ---------------------------------------------------------------------------------------
* about:url 处理相关方法
* author:马兆铿（13790371603 810768333@qq.com）
* date:2020-06-10
* ---------------------------------------------------------------------------------------- */

function getParams (url) {
  try {
    const index = url.indexOf('?')
    const obj = {}
    const arr = url.match(/\?([^#]+)/)[1].split('&')

    for (let i = 0; i < arr.length; i++) {
      const subArr = arr[i].split('=')
      const key = decodeURIComponent(subArr[0])
      obj[key] = decodeURIComponent(subArr[1])
    }
    return obj

  } catch (err) {
    return null
  }
}

export {
  getParams
}
