## Code Style

- 严格化
    - 避免使用 any，所有业务 ID（如 `OrderId`）**尽量**使用 `Branding` 模式
    - 精准用类型，比如类就用 interface 和 class，少用 type = Foo
    - 多推导，少定义。比如函数就用 function，少用 arrow function；返回类型尽量推导
- 清晰化
    - 不实用 I 开头（如 IColor，直接 Color 即可）
    - 不实用 type、new 等关键标识作为前缀或后缀
- 提交规范
    - 使用「emoji: Do something」的格式，提交英语信息。例如“🌟: Add a new feature”

## 逻辑规范

- 性能红线
    - DOM 元素嵌套禁止超过 12 层
    - JS 逻辑避免复杂度 O(n^2) 的逻辑
    - useEffect 必须显式返回销毁函数，防止产生 Detached DOM 节点或者泄漏对象
- 逻辑自愈能力，而非简单的 try-catch。
    - 重要函数支持默认值降级。比如数学计算，失败时候返回 0；订单渲染，失败时候仍要显示纯文本
