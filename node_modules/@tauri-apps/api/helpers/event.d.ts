import { WindowLabel } from '../window';
import type { EventName } from '../event';
export interface Event<T> {
    /** Event name */
    event: EventName;
    /** The label of the window that emitted this event. */
    windowLabel: string;
    /** Event identifier used to unlisten */
    id: number;
    /** Event payload */
    payload: T;
}
export declare type EventCallback<T> = (event: Event<T>) => void;
export declare type UnlistenFn = () => void;
/**
 * Emits an event to the backend.
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @param [windowLabel] The label of the window to which the event is sent, if null/undefined the event will be sent to all windows
 * @param [payload] Event payload
 * @returns
 */
declare function emit(event: string, windowLabel?: WindowLabel, payload?: unknown): Promise<void>;
/**
 * Listen to an event from the backend.
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @param handler Event handler callback.
 * @return A promise resolving to a function to unlisten to the event.
 */
declare function listen<T>(event: EventName, windowLabel: string | null, handler: EventCallback<T>): Promise<UnlistenFn>;
/**
 * Listen to an one-off event from the backend.
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @param handler Event handler callback.
 * @returns A promise resolving to a function to unlisten to the event.
 */
declare function once<T>(event: EventName, windowLabel: string | null, handler: EventCallback<T>): Promise<UnlistenFn>;
export { emit, listen, once };
