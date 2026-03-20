/* ---------------------------------------------------------------------------------------
 * about:取消功能测试
 * ---------------------------------------------------------------------------------------- */

import { describe, it, expect, vi } from 'vitest';
import axiosShell, { AxiosError, CancelToken } from '@/index';

describe('CancelToken-取消令牌测试', function () {
  it('创建取消源', () => {
    const source = CancelToken.source();
    expect(source.token).toBeInstanceOf(CancelToken);
    expect(source.cancel).toBeTypeOf('function');
  });

  it('取消后 isCancelled 为 true', () => {
    const source = CancelToken.source();
    expect(source.token.isCancelled).toBe(false);

    source.cancel('Operation canceled');
    expect(source.token.isCancelled).toBe(true);
  });

  it('取消后 reason 包含取消错误', () => {
    const source = CancelToken.source();
    source.cancel('Custom cancel message');

    const reason = source.token.reason;
    expect(reason).toBeInstanceOf(AxiosError);
    expect(reason?.code).toBe('ERR_CANCELED');
    expect(reason?.message).toBe('Custom cancel message');
  });

  it('throwIfRequested 在未取消时不抛出', () => {
    const source = CancelToken.source();
    expect(() => source.token.throwIfRequested()).not.toThrow();
  });

  it('throwIfRequested 在取消后抛出错误', () => {
    const source = CancelToken.source();
    source.cancel('Canceled');

    expect(() => source.token.throwIfRequested()).toThrow(AxiosError);
  });

  it('订阅取消事件', () => {
    const source = CancelToken.source();
    const listener = vi.fn();

    source.token.subscribe(listener);
    source.cancel('Test cancel');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.any(AxiosError));
  });

  it('取消后订阅会立即触发', () => {
    const source = CancelToken.source();
    const listener = vi.fn();

    source.cancel('Already canceled');
    source.token.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('取消订阅后不再接收事件', () => {
    const source = CancelToken.source();
    const listener = vi.fn();

    const unsubscribe = source.token.subscribe(listener);
    unsubscribe();
    source.cancel('Test cancel');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('请求取消-集成测试', function () {
  it('使用 CancelToken 取消请求', async () => {
    const source = CancelToken.source();

    const instance = axiosShell.create({
      adapter: () => new Promise(resolve => {
        setTimeout(() => resolve({ data: 'success' }), 100);
      }),
    });

    // 立即取消
    source.cancel('Request canceled by user');

    // 取消后请求应该立即抛出错误
    try {
      await instance.get('/test', {}, { cancelToken: source.token });
      expect.fail('Should have thrown');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError).toBeInstanceOf(AxiosError);
      expect(axiosError.code).toBe('ERR_CANCELED');
      expect(axiosError.message).toBe('Request canceled by user');
    }
  });

  it('请求过程中取消', async () => {
    const source = CancelToken.source();

    const instance = axiosShell.create({
      adapter: () => new Promise(resolve => {
        setTimeout(() => resolve({ data: 'success' }), 200);
      }),
    });

    // 延迟取消
    setTimeout(() => source.cancel('Delayed cancel'), 50);

    await expect(instance.get('/test', {}, { cancelToken: source.token }))
      .rejects.toBeInstanceOf(AxiosError);
  });

  it('使用 AbortSignal 取消请求', async () => {
    const controller = new AbortController();

    const instance = axiosShell.create({
      adapter: (config) => {
        // 模拟支持 AbortSignal 的 adapter
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve({ data: 'success' });
          }, 200);

          if (config.signal) {
            // 如果已经 aborted，立即拒绝
            if (config.signal.aborted) {
              clearTimeout(timeoutId);
              reject(new Error('The operation was aborted'));
              return;
            }
            config.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error('The operation was aborted'));
            });
          }
        });
      },
    });

    // 先发起请求
    const promise = instance.get('/test', {}, { signal: controller.signal });
    // 稍微延迟后取消，确保 adapter 已经开始执行
    await new Promise(r => setTimeout(r, 10));
    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(AxiosError);
  });

  it('未取消的请求正常完成', async () => {
    const source = CancelToken.source();

    const instance = axiosShell.create({
      adapter: () => Promise.resolve({ data: 'success' }),
    });

    const response = await instance.get('/test', {}, { cancelToken: source.token });
    expect(response).toHaveProperty('data', 'success');
  });

  it('请求完成后取消不影响结果', async () => {
    const source = CancelToken.source();

    const instance = axiosShell.create({
      adapter: () => Promise.resolve({ data: 'success' }),
    });

    const response = await instance.get('/test', {}, { cancelToken: source.token });
    expect(response).toHaveProperty('data', 'success');

    // 请求完成后取消
    source.cancel('Too late');
    expect(source.token.isCancelled).toBe(true);
  });
});
