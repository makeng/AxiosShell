/* ---------------------------------------------------------------------------------------
* about:华为 hilink 网络请求测试。请求函数（adapter）是模仿的，但是数据结构与 hilink 要求的一致。
* ---------------------------------------------------------------------------------------- */

import { describe, it, expect } from 'vitest';
import axiosShell from '../../../src/index';

interface HilinkConfig {
  domain: string;
  path: string;
  method: string;
  param: Record<string, unknown>;
}

interface HilinkResponse {
  newConfig: HilinkConfig;
  msg: string;
}

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
  function adapter(config: Record<string, unknown>): Promise<HilinkResponse> {
    const { baseURL, method, url, data } = config;
    const newConfig: HilinkConfig = {
      domain: baseURL as string,
      path: url as string,
      method: (method as string).toUpperCase(),
      param: (data as { params: Record<string, unknown> }).params
    };

    return Promise.resolve({
      newConfig,
      msg: '成功'
    });
  }

  const hilinkAxios = axiosShell.create({
    baseURL: 'http://homemate2.orvibo.com',
    adapter,
  });

  it('发送请求并接收结果', async () => {
    const res = await hilinkAxios.get('/channel', { params: { name: 'sport' } });
    console.log('仿真 hilink 请求结果', res);
    expect(res).toMatchObject({
      msg: '成功'
    });
  });
});
