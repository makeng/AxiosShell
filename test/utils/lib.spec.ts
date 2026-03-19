/* ---------------------------------------------------------------------------------------
* about:类型检查的测试
* ---------------------------------------------------------------------------------------- */

import { describe, it, expect } from 'vitest';
import { isArray, isObject } from '../../src/utils/lib';

// 测试
describe('utlis-类型检查', function () {

  it('object', () => {
    expect(isObject({ name: 1 })).toBe(true);
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject('')).toBe(false);
    expect(isObject(null)).toBe(false);
  });

  it('array', () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2])).toBe(true);
    expect(isArray({ name: 1 })).toBe(false);
    expect(isArray('')).toBe(false);
    expect(isArray(null)).toBe(false);
  });
});
