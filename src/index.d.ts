import InterceptorManager from './InterceptorManager';

type Method = 'get' | 'post' | 'head' | 'options' | 'put' | 'delete' | 'trace' | 'connect';

type AxiosRequestHandler<R = any> = (url: string, data?: Obj, config?: Obj) => Promise<R>;
//axios 请求方法类型
type AxiosRequest = Record<Method, AxiosRequestHandler>;

//config 类型
type AxiosRequestConfig = Partial<{
  //注入实际调用网络的方法
  request: (...args: any[]) => Promise<any>;
  timeout: number;
  [k: string]: any;
}>;

declare class AxiosShell implements AxiosRequest {
  defaults: Obj;
  request: (...args: any[]) => Promise<any>;
  interceptors: Record<'request' | 'response', InterceptorManager>;
  constructor(instanceConfig: AxiosRequestConfig);
  create(defaultConfig: AxiosRequestConfig): AxiosShell;
  get<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
  post<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
  head<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
  options<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
  put<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
  delete<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
  trace<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
  connect<R>(url: string, data?: Obj, config?: Obj): Promise<R>;
}
declare const axiosShell: AxiosShell;
export default axiosShell;
