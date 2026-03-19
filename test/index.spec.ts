/* ---------------------------------------------------------------------------------------
* about:主文件的测试
* ---------------------------------------------------------------------------------------- */

import { describe, it, expect, vi } from 'vitest';
import axiosShell, { AxiosError } from '@/index';

describe('axiosShell-功能测试', function () {

  const headers = { 'X-Custom-Header': 'foobar' };
  const testReq = axiosShell.create({
    baseURL: 'https://some-domain.com/api/',
    headers,
    adapter: () => Promise.resolve('foo'),
  });

  it('创建和配置', () => {
    expect(testReq.defaults).toBeTypeOf('object');
    expect(testReq.defaults.baseURL).toBeTypeOf('string');
  });

  it('有请求方法：get、post 等', () => {
    expect(testReq.get).toBeTypeOf('function');
    expect(testReq.post).toBeTypeOf('function');
  });

  it('支持拦截器', async () => {
    let interceptCnt = 0; // 计数器，每经过一个拦截器，就加一

    testReq.interceptors.request.use(
      config => {
        interceptCnt += 1;
        console.log('request 请求拦截成功', config);
        return config;
      },
      error => {
        console.log('request拦截错误');
        return Promise.reject(error);
      },
    );
    testReq.interceptors.response.use(
      res => {
        interceptCnt += 1;
        console.log('response 响应拦截成功', res);
        return res;
      },
      error => {
        console.log('request拦截错误');
        return Promise.reject(error);
      },
    );

    await testReq.get();
    expect(interceptCnt).toBe(2);
  });

  it('请求超时会失败', async () => {
    const delayReq = axiosShell.create({
      baseURL: 'https://some-domain.com/api/',
      timeout: 100,
      adapter: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('delay and resolve');
          }, 200);
        });
      },
    });

    await expect(delayReq.get()).rejects.toBeInstanceOf(AxiosError);
    try {
      await delayReq.get();
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.code).toBe('ECONNABORTED');
      expect(axiosError.message).toContain('timeout');
    }
  });
});
