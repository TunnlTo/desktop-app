/**
 * @since 1.0.0
 */
interface Duration {
    secs: number;
    nanos: number;
}
/**
 * @since 1.0.0
 */
interface ClientOptions {
    maxRedirections?: number;
    /**
     * Defines the maximum number of redirects the client should follow.
     * If set to 0, no redirects will be followed.
     */
    connectTimeout?: number | Duration;
}
/**
 * @since 1.0.0
 */
declare enum ResponseType {
    JSON = 1,
    Text = 2,
    Binary = 3
}
/**
 * @since 1.0.0
 */
interface FilePart<T> {
    file: string | T;
    mime?: string;
    fileName?: string;
}
declare type Part = string | Uint8Array | FilePart<Uint8Array>;
/**
 * The body object to be used on POST and PUT requests.
 *
 * @since 1.0.0
 */
declare class Body {
    type: string;
    payload: unknown;
    /** @ignore */
    private constructor();
    /**
     * Creates a new form data body. The form data is an object where each key is the entry name,
     * and the value is either a string or a file object.
     *
     * By default it sets the `application/x-www-form-urlencoded` Content-Type header,
     * but you can set it to `multipart/form-data` if the Cargo feature `http-multipart` is enabled.
     *
     * Note that a file path must be allowed in the `fs` allowlist scope.
     * @example
     * ```typescript
     * import { Body } from "@tauri-apps/api/http"
     * Body.form({
     *   key: 'value',
     *   image: {
     *     file: '/path/to/file', // either a path or an array buffer of the file contents
     *     mime: 'image/jpeg', // optional
     *     fileName: 'image.jpg' // optional
     *   }
     * });
     * ```
     *
     * @param data The body data.
     *
     * @returns The body object ready to be used on the POST and PUT requests.
     */
    static form(data: Record<string, Part>): Body;
    /**
     * Creates a new JSON body.
     * @example
     * ```typescript
     * import { Body } from "@tauri-apps/api/http"
     * Body.json({
     *   registered: true,
     *   name: 'tauri'
     * });
     * ```
     *
     * @param data The body JSON object.
     *
     * @returns The body object ready to be used on the POST and PUT requests.
     */
    static json(data: Record<any, any>): Body;
    /**
     * Creates a new UTF-8 string body.
     * @example
     * ```typescript
     * import { Body } from "@tauri-apps/api/http"
     * Body.text('The body content as a string');
     * ```
     *
     * @param value The body string.
     *
     * @returns The body object ready to be used on the POST and PUT requests.
     */
    static text(value: string): Body;
    /**
     * Creates a new byte array body.
     * @example
     * ```typescript
     * import { Body } from "@tauri-apps/api/http"
     * Body.bytes(new Uint8Array([1, 2, 3]));
     * ```
     *
     * @param bytes The body byte array.
     *
     * @returns The body object ready to be used on the POST and PUT requests.
     */
    static bytes(bytes: Iterable<number> | ArrayLike<number> | ArrayBuffer): Body;
}
/** The request HTTP verb. */
declare type HttpVerb = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';
/**
 * Options object sent to the backend.
 *
 * @since 1.0.0
 */
interface HttpOptions {
    method: HttpVerb;
    url: string;
    headers?: Record<string, any>;
    query?: Record<string, any>;
    body?: Body;
    timeout?: number | Duration;
    responseType?: ResponseType;
}
/** Request options. */
declare type RequestOptions = Omit<HttpOptions, 'method' | 'url'>;
/** Options for the `fetch` API. */
declare type FetchOptions = Omit<HttpOptions, 'url'>;
/** @ignore */
interface IResponse<T> {
    url: string;
    status: number;
    headers: Record<string, string>;
    rawHeaders: Record<string, string[]>;
    data: T;
}
/**
 * Response object.
 *
 * @since 1.0.0
 * */
declare class Response<T> {
    /** The request URL. */
    url: string;
    /** The response status code. */
    status: number;
    /** A boolean indicating whether the response was successful (status in the range 200–299) or not. */
    ok: boolean;
    /** The response headers. */
    headers: Record<string, string>;
    /** The response raw headers. */
    rawHeaders: Record<string, string[]>;
    /** The response data. */
    data: T;
    /** @ignore */
    constructor(response: IResponse<T>);
}
/**
 * @since 1.0.0
 */
declare class Client {
    id: number;
    /** @ignore */
    constructor(id: number);
    /**
     * Drops the client instance.
     * @example
     * ```typescript
     * import { getClient } from '@tauri-apps/api/http';
     * const client = await getClient();
     * await client.drop();
     * ```
     */
    drop(): Promise<void>;
    /**
     * Makes an HTTP request.
     * @example
     * ```typescript
     * import { getClient } from '@tauri-apps/api/http';
     * const client = await getClient();
     * const response = await client.request({
     *   method: 'GET',
     *   url: 'http://localhost:3003/users',
     * });
     * ```
     */
    request<T>(options: HttpOptions): Promise<Response<T>>;
    /**
     * Makes a GET request.
     * @example
     * ```typescript
     * import { getClient, ResponseType } from '@tauri-apps/api/http';
     * const client = await getClient();
     * const response = await client.get('http://localhost:3003/users', {
     *   timeout: 30,
     *   // the expected response type
     *   responseType: ResponseType.JSON
     * });
     * ```
     */
    get<T>(url: string, options?: RequestOptions): Promise<Response<T>>;
    /**
     * Makes a POST request.
     * @example
     * ```typescript
     * import { getClient, Body, ResponseType } from '@tauri-apps/api/http';
     * const client = await getClient();
     * const response = await client.post('http://localhost:3003/users', {
     *   body: Body.json({
     *     name: 'tauri',
     *     password: 'awesome'
     *   }),
     *   // in this case the server returns a simple string
     *   responseType: ResponseType.Text,
     * });
     * ```
     */
    post<T>(url: string, body?: Body, options?: RequestOptions): Promise<Response<T>>;
    /**
     * Makes a PUT request.
     * @example
     * ```typescript
     * import { getClient, Body } from '@tauri-apps/api/http';
     * const client = await getClient();
     * const response = await client.put('http://localhost:3003/users/1', {
     *   body: Body.form({
     *     file: {
     *       file: '/home/tauri/avatar.png',
     *       mime: 'image/png',
     *       fileName: 'avatar.png'
     *     }
     *   })
     * });
     * ```
     */
    put<T>(url: string, body?: Body, options?: RequestOptions): Promise<Response<T>>;
    /**
     * Makes a PATCH request.
     * @example
     * ```typescript
     * import { getClient, Body } from '@tauri-apps/api/http';
     * const client = await getClient();
     * const response = await client.patch('http://localhost:3003/users/1', {
     *   body: Body.json({ email: 'contact@tauri.app' })
     * });
     * ```
     */
    patch<T>(url: string, options?: RequestOptions): Promise<Response<T>>;
    /**
     * Makes a DELETE request.
     * @example
     * ```typescript
     * import { getClient } from '@tauri-apps/api/http';
     * const client = await getClient();
     * const response = await client.delete('http://localhost:3003/users/1');
     * ```
     */
    delete<T>(url: string, options?: RequestOptions): Promise<Response<T>>;
}
/**
 * Creates a new client using the specified options.
 * @example
 * ```typescript
 * import { getClient } from '@tauri-apps/api/http';
 * const client = await getClient();
 * ```
 *
 * @param options Client configuration.
 *
 * @returns A promise resolving to the client instance.
 *
 * @since 1.0.0
 */
declare function getClient(options?: ClientOptions): Promise<Client>;
/**
 * Perform an HTTP request using the default client.
 * @example
 * ```typescript
 * import { fetch } from '@tauri-apps/api/http';
 * const response = await fetch('http://localhost:3003/users/2', {
 *   method: 'GET',
 *   timeout: 30,
 * });
 * ```
 */
declare function fetch<T>(url: string, options?: FetchOptions): Promise<Response<T>>;
export type { Duration, ClientOptions, Part, HttpVerb, HttpOptions, RequestOptions, FetchOptions };
export { getClient, fetch, Body, Client, Response, ResponseType, FilePart };
