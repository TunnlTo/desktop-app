/**
 * Customize the auto updater flow.
 *
 * This package is also accessible with `window.__TAURI__.updater` when [`build.withGlobalTauri`](https://tauri.app/v1/api/config/#buildconfig.withglobaltauri) in `tauri.conf.json` is set to `true`.
 * @module
 */
import { UnlistenFn } from './event';
/**
 * @since 1.0.0
 */
declare type UpdateStatus = 'PENDING' | 'ERROR' | 'DONE' | 'UPTODATE';
/**
 * @since 1.0.0
 */
interface UpdateStatusResult {
    error?: string;
    status: UpdateStatus;
}
/**
 * @since 1.0.0
 */
interface UpdateManifest {
    version: string;
    date: string;
    body: string;
}
/**
 * @since 1.0.0
 */
interface UpdateResult {
    manifest?: UpdateManifest;
    shouldUpdate: boolean;
}
/**
 * Listen to an updater event.
 * @example
 * ```typescript
 * import { onUpdaterEvent } from "@tauri-apps/api/updater";
 * const unlisten = await onUpdaterEvent(({ error, status }) => {
 *  console.log('Updater event', error, status);
 * });
 *
 * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
 * unlisten();
 * ```
 *
 * @returns A promise resolving to a function to unlisten to the event.
 * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
 *
 * @since 1.0.2
 */
declare function onUpdaterEvent(handler: (status: UpdateStatusResult) => void): Promise<UnlistenFn>;
/**
 * Install the update if there's one available.
 * @example
 * ```typescript
 * import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
 * const update = await checkUpdate();
 * if (update.shouldUpdate) {
 *   console.log(`Installing update ${update.manifest?.version}, ${update.manifest?.date}, ${update.manifest.body}`);
 *   await installUpdate();
 * }
 * ```
 *
 * @return A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function installUpdate(): Promise<void>;
/**
 * Checks if an update is available.
 * @example
 * ```typescript
 * import { checkUpdate } from '@tauri-apps/api/updater';
 * const update = await checkUpdate();
 * // now run installUpdate() if needed
 * ```
 *
 * @return Promise resolving to the update status.
 *
 * @since 1.0.0
 */
declare function checkUpdate(): Promise<UpdateResult>;
export type { UpdateStatus, UpdateStatusResult, UpdateManifest, UpdateResult };
export { onUpdaterEvent, installUpdate, checkUpdate };
