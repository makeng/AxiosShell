# AxiosShell

### 简介

☁ fetch 类网络请求的封装库。某些项目、框架不允许直接使用 axios 之类的 HTTP 请求库，所以需要对项目/框架自带的 fetch 请求进行简单封装。

- 【华为小圆】华为不允许直接使用 axios 之类的 http 请求，否则在「厂商测试云」环境会出现 https 请求失败。华为提供的 fetch 请求方法只是简单的回调，没有 Promise 封装、共用配置、超时、拦截器等功能，所以需要当前项目作为 npm 插件。
- 【快应用项目】没有 xhr 对象，也没有 axios 库，只有简单的 fetch 函数。类似功能的快应用网络请求库「Flyjs」又不是很符合 axios 的代码习惯。





### 资料

- 代码设计解读：[【util-axiosShell】代码解读](https://www.yuque.com/orvibo/paene9/clyzgi)
  - 设计基于 Axios，只是把 HTTP 请求部分的功能剔除，传入 adapter 属性代替这部分
  - 如果对项目进行了更新，请更新文章，维持良好的设计素质





### 安装

```bash
npm install git+https://github.com/makeng/AxiosShell.git
```

### 使用示例

```typescript
import axiosShell from 'axios-shell';

const instance = axiosShell.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  adapter: (config) => {
    // 使用项目提供的请求方法（如华为小圆的 fetch）
    return fetch(config.url!, {
      method: config.method,
      headers: config.headers,
      body: JSON.stringify(config.data),
    }).then(res => res.json());
  }
});

// 添加拦截器
instance.interceptors.request.use(config => {
  config.headers = { ...config.headers, 'X-Token': 'your-token' };
  return config;
});

// 发起请求
const data = await instance.get('/users');
```

### 功能对比

AxiosShell 设计基于 Axios API，移除了 HTTP 请求引擎部分，通过 `adapter` 属性接入任意 fetch 实现。

| 功能特性 | Axios | AxiosShell | 说明 |
|---------|-------|------------|------|
| **核心请求** |
| GET / POST / PUT / DELETE 等 HTTP 方法 | ✅ | ✅ | 支持所有标准 HTTP 方法 |
| 实例化 (create) | ✅ | ✅ | 支持创建实例和全局配置 |
| 请求/响应拦截器 | ✅ | ✅ | 支持添加、删除、清空拦截器 |
| 超时控制 (timeout) | ✅ | ✅ | 支持请求超时设置 |
| baseURL 配置 | ✅ | ✅ | 支持基础 URL 前缀 |
| headers 配置 | ✅ | ✅ | 支持自定义请求头 |
| params 参数 | ✅ | ✅ | 支持 URL 查询参数 |
| data 请求体 | ✅ | ✅ | 支持请求体数据 |
| validateStatus | ✅ | ✅ | 支持自定义状态码验证 |
| **错误处理** |
| AxiosError 错误类 | ✅ | ✅ | 统一的错误封装 |
| 超时错误 (ECONNABORTED) | ✅ | ✅ | 超时错误识别 |
| 网络错误 (ERR_NETWORK) | ✅ | ✅ | 网络错误识别 |
| 响应错误 (ERR_BAD_RESPONSE) | ✅ | ✅ | HTTP 错误状态码处理 |
| 请求错误 (ERR_BAD_REQUEST) | ✅ | ✅ | 请求错误识别 |
| **高级功能** |
| 自定义 adapter | ✅ | ✅ | **核心特性**，可接入任意 fetch 实现 |
| 请求取消 (CancelToken) | ✅ | ❌ | 暂未实现 |
| 自动转换请求/响应数据 | ✅ | ❌ | 需通过拦截器或 adapter 自行实现 |
| 自动处理 XSRF/CSRF | ✅ | ❌ | 需自行实现 |
| 进度监控 (onUploadProgress) | ✅ | ❌ | 依赖 XMLHttpRequest，fetch 不支持 |
| 代理配置 (proxy) | ✅ | ❌ | 需通过 adapter 实现 |
| 并发请求 (all / spread) | ✅ | ❌ | 可使用 Promise.all 替代 |

### 开发说明

本项目基于「测试驱动开发(TDD)」进行开发，使用 Vitest 作为测试框架。

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 监听模式运行测试
npm run test:watch

# 构建
npm run build
```

