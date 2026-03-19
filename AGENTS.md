## Code Style

- 严格化
    - 避免使用 any，所有业务 ID（如 `OrderId`）**尽量**使用 `Branding` 模式
    - 精准用类型，比如类就用 interface 和 class，少用 type = Foo
    - 多推导，少定义。比如函数就用 function，少用 arrow function；返回类型尽量推导
- 清晰化：不实用 I 开头（如 IColor，直接 Color 即可）
- 变量名清晰：不实用 type、new 等关键标识作为前缀或后缀


## 逻辑规范

- 性能红线：DOM 元素嵌套要浅；JS 逻辑避免复杂度 O(n^2) 的逻辑
- 逻辑自愈能力，而非简单的 try-catch。
