interface InterceptorHandler<V = unknown> {
    fulfilled: ((value: V) => V | Promise<V>) | null;
    rejected: ((error: unknown) => unknown) | null;
}
declare class InterceptorManager<V = unknown> {
    handlers: (InterceptorHandler<V> | null)[];
    constructor();
    /**
     * 迭代器
     * @param fn
     */
    forEach(fn: (h: InterceptorHandler<V>) => void): void;
    /**
     * 添加拦截器
     */
    use(fulfilled?: ((value: V) => V | Promise<V>) | null, rejected?: ((error: unknown) => unknown) | null): number;
    /**
     * 删除拦截器
     * @param id 在 handlers 中的序号
     */
    eject(id: number): void;
    /**
     * 清空拦截器
     */
    clear(): void;
}
export default InterceptorManager;
export { InterceptorHandler };
