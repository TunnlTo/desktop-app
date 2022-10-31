/**
 * Writes plain text to the clipboard.
 * @example
 * ```typescript
 * import { writeText, readText } from '@tauri-apps/api/clipboard';
 * await writeText('Tauri is awesome!');
 * assert(await readText(), 'Tauri is awesome!');
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0.
 */
declare function writeText(text: string): Promise<void>;
/**
 * Gets the clipboard content as plain text.
 * @example
 * ```typescript
 * import { readText } from '@tauri-apps/api/clipboard';
 * const clipboardText = await readText();
 * ```
 * @since 1.0.0.
 */
declare function readText(): Promise<string | null>;
export { writeText, readText };
