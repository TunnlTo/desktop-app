export declare type ShortcutHandler = (shortcut: string) => void;
/**
 * Register a global shortcut.
 * @example
 * ```typescript
 * import { register } from '@tauri-apps/api/globalShortcut';
 * await register('CommandOrControl+Shift+C', () => {
 *   console.log('Shortcut triggered');
 * });
 * ```
 *
 * @param shortcut Shortcut definition, modifiers and key separated by "+" e.g. CmdOrControl+Q
 * @param handler Shortcut handler callback - takes the triggered shortcut as argument
 *
 * @since 1.0.0
 */
declare function register(shortcut: string, handler: ShortcutHandler): Promise<void>;
/**
 * Register a collection of global shortcuts.
 * @example
 * ```typescript
 * import { registerAll } from '@tauri-apps/api/globalShortcut';
 * await registerAll(['CommandOrControl+Shift+C', 'Ctrl+Alt+F12'], (shortcut) => {
 *   console.log(`Shortcut ${shortcut} triggered`);
 * });
 * ```
 *
 * @param shortcuts Array of shortcut definitions, modifiers and key separated by "+" e.g. CmdOrControl+Q
 * @param handler Shortcut handler callback - takes the triggered shortcut as argument
 *
 * @since 1.0.0
 */
declare function registerAll(shortcuts: string[], handler: ShortcutHandler): Promise<void>;
/**
 * Determines whether the given shortcut is registered by this application or not.
 * @example
 * ```typescript
 * import { isRegistered } from '@tauri-apps/api/globalShortcut';
 * const isRegistered = await isRegistered('CommandOrControl+P');
 * ```
 *
 * @param shortcut Array of shortcut definitions, modifiers and key separated by "+" e.g. CmdOrControl+Q
 *
 * @since 1.0.0
 */
declare function isRegistered(shortcut: string): Promise<boolean>;
/**
 * Unregister a global shortcut.
 * @example
 * ```typescript
 * import { unregister } from '@tauri-apps/api/globalShortcut';
 * await unregister('CmdOrControl+Space');
 * ```
 *
 * @param shortcut shortcut definition, modifiers and key separated by "+" e.g. CmdOrControl+Q
 *
 * @since 1.0.0
 */
declare function unregister(shortcut: string): Promise<void>;
/**
 * Unregisters all shortcuts registered by the application.
 * @example
 * ```typescript
 * import { unregisterAll } from '@tauri-apps/api/globalShortcut';
 * await unregisterAll();
 * ```
 *
 * @since 1.0.0
 */
declare function unregisterAll(): Promise<void>;
export { register, registerAll, isRegistered, unregister, unregisterAll };
