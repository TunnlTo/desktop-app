import type { EventCallback, UnlistenFn, Event } from './helpers/event';
export declare type EventName = TauriEvent | string;
/**
 * @since 1.1.0
 */
export declare enum TauriEvent {
    WINDOW_RESIZED = "tauri://resize",
    WINDOW_MOVED = "tauri://move",
    WINDOW_CLOSE_REQUESTED = "tauri://close-requested",
    WINDOW_CREATED = "tauri://window-created",
    WINDOW_DESTROYED = "tauri://destroyed",
    WINDOW_FOCUS = "tauri://focus",
    WINDOW_BLUR = "tauri://blur",
    WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change",
    WINDOW_THEME_CHANGED = "tauri://theme-changed",
    WINDOW_FILE_DROP = "tauri://file-drop",
    WINDOW_FILE_DROP_HOVER = "tauri://file-drop-hover",
    WINDOW_FILE_DROP_CANCELLED = "tauri://file-drop-cancelled",
    MENU = "tauri://menu",
    CHECK_UPDATE = "tauri://update",
    UPDATE_AVAILABLE = "tauri://update-available",
    INSTALL_UPDATE = "tauri://update-install",
    STATUS_UPDATE = "tauri://update-status",
    DOWNLOAD_PROGRESS = "tauri://update-download-progress"
}
/**
 * Listen to an event from the backend.
 *
 * @example
 * ```typescript
 * import { listen } from '@tauri-apps/api/event';
 * const unlisten = await listen<string>('error', (event) => {
 *   console.log(`Got error in window ${event.windowLabel}, payload: ${payload}`);
 * });
 *
 * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
 * unlisten();
 * ```
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @param handler Event handler callback.
 * @returns A promise resolving to a function to unlisten to the event.
 * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
 *
 * @since 1.0.0
 */
declare function listen<T>(event: EventName, handler: EventCallback<T>): Promise<UnlistenFn>;
/**
 * Listen to an one-off event from the backend.
 *
 * @example
 * ```typescript
 * import { once } from '@tauri-apps/api/event';
 * interface LoadedPayload {
 *   loggedIn: boolean,
 *   token: string
 * }
 * const unlisten = await once<LoadedPayload>('loaded', (event) => {
 *   console.log(`App is loaded, loggedIn: ${event.payload.loggedIn}, token: ${event.payload.token}`);
 * });
 *
 * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
 * unlisten();
 * ```
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @returns A promise resolving to a function to unlisten to the event.
 * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
 *
 * @since 1.0.0
 */
declare function once<T>(event: EventName, handler: EventCallback<T>): Promise<UnlistenFn>;
/**
 * Emits an event to the backend.
 * @example
 * ```typescript
 * import { emit } from '@tauri-apps/api/event';
 * await emit('frontend-loaded', { loggedIn: true, token: 'authToken' });
 * ```
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 *
 * @since 1.0.0
 */
declare function emit(event: string, payload?: unknown): Promise<void>;
export type { Event, EventCallback, UnlistenFn };
export { listen, once, emit };
