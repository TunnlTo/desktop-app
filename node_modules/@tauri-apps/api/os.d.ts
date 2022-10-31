declare type Platform = 'linux' | 'darwin' | 'ios' | 'freebsd' | 'dragonfly' | 'netbsd' | 'openbsd' | 'solaris' | 'android' | 'win32';
declare type OsType = 'Linux' | 'Darwin' | 'Windows_NT';
declare type Arch = 'x86' | 'x86_64' | 'arm' | 'aarch64' | 'mips' | 'mips64' | 'powerpc' | 'powerpc64' | 'riscv64' | 's390x' | 'sparc64';
/**
 * The operating system-specific end-of-line marker.
 * - `\n` on POSIX
 * - `\r\n` on Windows
 *
 * @since 1.0.0
 * */
declare const EOL: string;
/**
 * Returns a string identifying the operating system platform.
 * The value is set at compile time. Possible values are `'linux'`, `'darwin'`, `'ios'`, `'freebsd'`, `'dragonfly'`, `'netbsd'`, `'openbsd'`, `'solaris'`, `'android'`, `'win32'`
 * @example
 * ```typescript
 * import { platform } from '@tauri-apps/api/os';
 * const platformName = await platform();
 * ```
 *
 * @since 1.0.0
 *
 */
declare function platform(): Promise<Platform>;
/**
 * Returns a string identifying the kernel version.
 * @example
 * ```typescript
 * import { version } from '@tauri-apps/api/os';
 * const osVersion = await version();
 * ```
 *
 * @since 1.0.0
 */
declare function version(): Promise<string>;
/**
 * Returns `'Linux'` on Linux, `'Darwin'` on macOS, and `'Windows_NT'` on Windows.
 * @example
 * ```typescript
 * import { type } from '@tauri-apps/api/os';
 * const osType = await type();
 * ```
 *
 * @since 1.0.0
 */
declare function type(): Promise<OsType>;
/**
 * Returns the operating system CPU architecture for which the tauri app was compiled.
 * Possible values are `'x86'`, `'x86_64'`, `'arm'`, `'aarch64'`, `'mips'`, `'mips64'`, `'powerpc'`, `'powerpc64'`, `'riscv64'`, `'s390x'`, `'sparc64'`.
 * @example
 * ```typescript
 * import { arch } from '@tauri-apps/api/os';
 * const archName = await arch();
 * ```
 *
 * @since 1.0.0
 */
declare function arch(): Promise<Arch>;
/**
 * Returns the operating system's default directory for temporary files as a string.
 * @example
 * ```typescript
 * import { tempdir } from '@tauri-apps/api/os';
 * const tempdirPath = await tempdir();
 * ```
 *
 * @since 1.0.0
 */
declare function tempdir(): Promise<string>;
export { EOL, platform, version, type, arch, tempdir };
export type { Platform, OsType, Arch };
