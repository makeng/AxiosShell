/* ---------------------------------------------------------------------------------------
* about:主文件的测试
* author:马兆铿（13790371603 810768333@qq.com）
* date:2020-06-09
* ---------------------------------------------------------------------------------------- */

import axiosLike from '../../src'

describe('axiosLike-功能测试', function () {

  const headers = { 'X-Custom-Header': 'foobar' }
  const testReq = axiosLike.create({
    baseURL: 'https://some-domain.com/api/',
    headers,
    request: () => Promise.resolve('foo')
  })

  it('创建和配置', () => {
    expect(testReq.defaults).toEqual(jasmine.any(Object))
    expect(testReq.defaults.baseURL).toEqual(jasmine.any(String))
  })

  it('有请求方法：get、post 等', () => {
    expect(testReq.get).toEqual(jasmine.any(Function))
    expect(testReq.post).toEqual(jasmine.any(Function))
  })

  it('支持拦截器', done => {
    let interceptCnt = 0 // 计数器，每经过一个拦截器，就加一

    testReq.interceptors.request.use(
      config => {
        interceptCnt += 1
        console.log('request 请求拦截成功', config)
        return config
      },
      error => {
        console.log('request拦截错误')
        return Promise.reject(error)
      }
    )
    testReq.interceptors.response.use(
      res => {
        interceptCnt += 1
        console.log('response 响应拦截成功', res)
        return res
      },
      error => {
        console.log('request拦截错误')
        return Promise.reject(error)
      }
    )

    testReq.get().then(config => {
      done(expect(interceptCnt).toBe(2))
    }).catch(err => {
      done.fail(err)
    })
  })

  it('请求超时会失败', done => {
    const delayReq = axiosLike.create({
      baseURL: 'https://some-domain.com/api/',
      timeout: 100,
      request: () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve('delay and resolve')
          }, 200)
        })
      }
    })

    delayReq.get().then(res => {
      console.log('此处不应该成功，因为返回时间超过了 timeout')
      done.fail(res)
    }).catch(err => {
      console.log('超时的结果', err)
      done(err)
    })
  })
})
