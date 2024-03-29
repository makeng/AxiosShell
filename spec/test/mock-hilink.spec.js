/* ---------------------------------------------------------------------------------------
* about:华为 hilink 网络请求测试。请求函数（adapter）是模仿的，但是数据结构与 hilink 要求的一致。
* author:马兆铿（13790371603 810768333@qq.com）
* date:2019-06-10
* ---------------------------------------------------------------------------------------- */

import axiosShell from '../../src'

/**
 * 输入是 axios 一样的方法：
 * - axios.get(path, {params})
 * - axios.post(path, params)
 * 输出是 hilink 希望得出这样的请求参数
 * {
      'domain': 'http://homemate2.orvibo.com',
      'path': '/channel?m=queryPublicChannel',
      'method': 'GET',
      'param': {},
    }
 */
describe('axiosShell-仿真华为 hilink 接口测试', function () {

  // 请求仿真函数:接收所有 axios 参数形式的 config，转变成 hilnik 需要的
  function adapter(config) {
    const { baseURL, method, url, data } = config
    const newConfig = {
      domain: baseURL,
      path: url,
      method: method.toUpperCase(),
      param: data.params
    }

    return Promise.resolve({
      newConfig,
      msg: '成功'
    })
  }

  const hilinkAxios = axiosShell.create({
    baseURL: 'http://homemate2.orvibo.com',
    adapter,
  })

  it('发送请求并接收结果', done => {
    hilinkAxios.get('/channel', { params: { name: 'sport' } }).then(res => {
      console.log('仿真 hilink 请求结果', res)
      done(res)
    }).catch(err => {
      console.warn('请求失败', err)
    })
  })
})
