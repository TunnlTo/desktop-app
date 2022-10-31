/**
 * @since 1.0.0
 */
export declare enum BaseDirectory {
    Audio = 1,
    Cache = 2,
    Config = 3,
    Data = 4,
    LocalData = 5,
    Desktop = 6,
    Document = 7,
    Download = 8,
    Executable = 9,
    Font = 10,
    Home = 11,
    Picture = 12,
    Public = 13,
    Runtime = 14,
    Template = 15,
    Video = 16,
    Resource = 17,
    App = 18,
    Log = 19,
    Temp = 20
}
/**
 * @since 1.0.0
 */
interface FsOptions {
    dir?: BaseDirectory;
}
/**
 * @since 1.0.0
 */
interface FsDirOptions {
    dir?: BaseDirectory;
    recursive?: boolean;
}
/**
 * Options object used to write a UTF-8 string to a file.
 *
 * @since 1.0.0
 */
interface FsTextFileOption {
    /** Path to the file to write. */
    path: string;
    /** The UTF-8 string to write to the file. */
    contents: string;
}
declare type BinaryFileContents = Iterable<number> | ArrayLike<number> | ArrayBuffer;
/**
 * Options object used to write a binary data to a file.
 *
 * @since 1.0.0
 */
interface FsBinaryFileOption {
    /** Path to the file to write. */
    path: string;
    /** The byte array contents. */
    contents: BinaryFileContents;
}
/**
 * @since 1.0.0
 */
interface FileEntry {
    path: string;
    /**
     * Name of the directory/file
     * can be null if the path terminates with `..`
     */
    name?: string;
    /** Children of this entry if it's a directory; null otherwise */
    children?: FileEntry[];
}
/**
 * Reads a file as an UTF-8 encoded string.
 * @example
 * ```typescript
 * import { readTextFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Read the text file in the `$APPDIR/app.conf` path
 * const contents = await readTextFile('app.conf', { dir: BaseDirectory.App });
 * ```
 *
 * @since 1.0.0
 */
declare function readTextFile(filePath: string, options?: FsOptions): Promise<string>;
/**
 * Reads a file as byte array.
 * @example
 * ```typescript
 * import { readBinaryFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Read the image file in the `$RESOURCEDIR/avatar.png` path
 * const contents = await readBinaryFile('avatar.png', { dir: BaseDirectory.Resource });
 * ```
 *
 * @since 1.0.0
 */
declare function readBinaryFile(filePath: string, options?: FsOptions): Promise<Uint8Array>;
/**
 * Writes a UTF-8 text file.
 * @example
 * ```typescript
 * import { writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Write a text file to the `$APPDIR/app.conf` path
 * await writeTextFile('app.conf', 'file contents', { dir: BaseDirectory.App });
 * ```
 *
 * @since 1.0.0
 */
declare function writeTextFile(path: string, contents: string, options?: FsOptions): Promise<void>;
/**
 * Writes a UTF-8 text file.
 * @example
 * ```typescript
 * import { writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Write a text file to the `$APPDIR/app.conf` path
 * await writeTextFile({ path: 'app.conf', contents: 'file contents' }, { dir: BaseDirectory.App });
 * ```
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function writeTextFile(file: FsTextFileOption, options?: FsOptions): Promise<void>;
/**
 * Writes a byte array content to a file.
 * @example
 * ```typescript
 * import { writeBinaryFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Write a binary file to the `$APPDIR/avatar.png` path
 * await writeBinaryFile('avatar.png', new Uint8Array([]), { dir: BaseDirectory.App });
 * ```
 *
 * @param options Configuration object.
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function writeBinaryFile(path: string, contents: BinaryFileContents, options?: FsOptions): Promise<void>;
/**
 * Writes a byte array content to a file.
 * @example
 * ```typescript
 * import { writeBinaryFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Write a binary file to the `$APPDIR/avatar.png` path
 * await writeBinaryFile({ path: 'avatar.png', contents: new Uint8Array([]) }, { dir: BaseDirectory.App });
 * ```
 *
 * @param file The object containing the file path and contents.
 * @param options Configuration object.
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function writeBinaryFile(file: FsBinaryFileOption, options?: FsOptions): Promise<void>;
/**
 * List directory files.
 * @example
 * ```typescript
 * import { readDir, BaseDirectory } from '@tauri-apps/api/fs';
 * // Reads the `$APPDIR/users` directory recursively
 * const entries = await readDir('users', { dir: BaseDirectory.App, recursive: true });
 *
 * function processEntries(entries) {
 *   for (const entry of entries) {
 *     console.log(`Entry: ${entry.path}`);
 *     if (entry.children) {
 *       processEntries(entry.children)
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
declare function readDir(dir: string, options?: FsDirOptions): Promise<FileEntry[]>;
/**
 * Creates a directory.
 * If one of the path's parent components doesn't exist
 * and the `recursive` option isn't set to true, the promise will be rejected.
 * @example
 * ```typescript
 * import { createDir, BaseDirectory } from '@tauri-apps/api/fs';
 * // Create the `$APPDIR/users` directory
 * await createDir('users', { dir: BaseDirectory.App, recursive: true });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function createDir(dir: string, options?: FsDirOptions): Promise<void>;
/**
 * Removes a directory.
 * If the directory is not empty and the `recursive` option isn't set to true, the promise will be rejected.
 * @example
 * ```typescript
 * import { removeDir, BaseDirectory } from '@tauri-apps/api/fs';
 * // Remove the directory `$APPDIR/users`
 * await removeDir('users', { dir: BaseDirectory.App });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function removeDir(dir: string, options?: FsDirOptions): Promise<void>;
/**
 * Copies a file to a destination.
 * @example
 * ```typescript
 * import { copyFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Copy the `$APPDIR/app.conf` file to `$APPDIR/app.conf.bk`
 * await copyFile('app.conf', 'app.conf.bk', { dir: BaseDirectory.App });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function copyFile(source: string, destination: string, options?: FsOptions): Promise<void>;
/**
 * Removes a file.
 * @example
 * ```typescript
 * import { removeFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Remove the `$APPDIR/app.conf` file
 * await removeFile('app.conf', { dir: BaseDirectory.App });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function removeFile(file: string, options?: FsOptions): Promise<void>;
/**
 * Renames a file.
 * @example
 * ```typescript
 * import { renameFile, BaseDirectory } from '@tauri-apps/api/fs';
 * // Rename the `$APPDIR/avatar.png` file
 * await renameFile('avatar.png', 'deleted.png', { dir: BaseDirectory.App });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 1.0.0
 */
declare function renameFile(oldPath: string, newPath: string, options?: FsOptions): Promise<void>;
/**
 * Check if a path exists.
 * @example
 * ```typescript
 * import { exists, BaseDirectory } from '@tauri-apps/api/fs';
 * // Check if the `$APPDIR/avatar.png` file exists
 * await exists('avatar.png', { dir: BaseDirectory.App });
 * ```
 *
 * @since 1.1.0
 */
declare function exists(path: string, options?: FsOptions): Promise<void>;
export type { FsOptions, FsDirOptions, FsTextFileOption, BinaryFileContents, FsBinaryFileOption, FileEntry };
export { BaseDirectory as Dir, readTextFile, readBinaryFile, writeTextFile, writeTextFile as writeFile, writeBinaryFile, readDir, createDir, removeDir, copyFile, removeFile, renameFile, exists };
