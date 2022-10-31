/**
 * @since 1.0.0
 */
interface SpawnOptions {
    /** Current working directory. */
    cwd?: string;
    /** Environment variables. set to `null` to clear the process env. */
    env?: {
        [name: string]: string;
    };
    /**
     * Character encoding for stdout/stderr
     *
     * @since 1.1.0
     *  */
    encoding?: string;
}
/**
 * @since 1.0.0
 */
interface ChildProcess {
    /** Exit code of the process. `null` if the process was terminated by a signal on Unix. */
    code: number | null;
    /** If the process was terminated by a signal, represents that signal. */
    signal: number | null;
    /** The data that the process wrote to `stdout`. */
    stdout: string;
    /** The data that the process wrote to `stderr`. */
    stderr: string;
}
/**
 * @since 1.0.0
 */
declare class EventEmitter<E extends string> {
    /** @ignore */
    private eventListeners;
    /**
     * Alias for `emitter.on(eventName, listener)`.
     *
     * @since 1.1.0
     */
    addListener(eventName: E, listener: (...args: any[]) => void): this;
    /**
     * Alias for `emitter.off(eventName, listener)`.
     *
     * @since 1.1.0
     */
    removeListener(eventName: E, listener: (...args: any[]) => void): this;
    /**
     * Adds the `listener` function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the `listener` has
     * already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
     * times.
     *
     * Returns a reference to the `EventEmitter`, so that calls can be chained.
     *
     * @since 1.0.0
     */
    on(eventName: E, listener: (...args: any[]) => void): this;
    /**
     * Adds a **one-time**`listener` function for the event named `eventName`. The
     * next time `eventName` is triggered, this listener is removed and then invoked.
     *
     * Returns a reference to the `EventEmitter`, so that calls can be chained.
     *
     * @since 1.1.0
     */
    once(eventName: E, listener: (...args: any[]) => void): this;
    /**
     * Removes the all specified listener from the listener array for the event eventName
     * Returns a reference to the `EventEmitter`, so that calls can be chained.
     *
     * @since 1.1.0
     */
    off(eventName: E, listener: (...args: any[]) => void): this;
    /**
     * Removes all listeners, or those of the specified eventName.
     *
     * Returns a reference to the `EventEmitter`, so that calls can be chained.
     *
     * @since 1.1.0
     */
    removeAllListeners(event?: E): this;
    /**
     * @ignore
     * Synchronously calls each of the listeners registered for the event named`eventName`, in the order they were registered, passing the supplied arguments
     * to each.
     *
     * @returns `true` if the event had listeners, `false` otherwise.
     */
    emit(eventName: E, ...args: any[]): boolean;
    /**
     * Returns the number of listeners listening to the event named `eventName`.
     *
     * @since 1.1.0
     */
    listenerCount(eventName: E): number;
    /**
     * Adds the `listener` function to the _beginning_ of the listeners array for the
     * event named `eventName`. No checks are made to see if the `listener` has
     * already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
     * times.
     *
     * Returns a reference to the `EventEmitter`, so that calls can be chained.
     *
     * @since 1.1.0
     */
    prependListener(eventName: E, listener: (...args: any[]) => void): this;
    /**
     * Adds a **one-time**`listener` function for the event named `eventName` to the_beginning_ of the listeners array. The next time `eventName` is triggered, this
     * listener is removed, and then invoked.
     *
     * Returns a reference to the `EventEmitter`, so that calls can be chained.
     *
     * @since 1.1.0
     */
    prependOnceListener(eventName: E, listener: (...args: any[]) => void): this;
}
/**
 * @since 1.1.0
 */
declare class Child {
    /** The child process `pid`. */
    pid: number;
    constructor(pid: number);
    /**
     * Writes `data` to the `stdin`.
     *
     * @param data The message to write, either a string or a byte array.
     * @example
     * ```typescript
     * import { Command } from '@tauri-apps/api/shell';
     * const command = new Command('node');
     * const child = await command.spawn();
     * await child.write('message');
     * await child.write([0, 1, 2, 3, 4, 5]);
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    write(data: string | Uint8Array): Promise<void>;
    /**
     * Kills the child process.
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    kill(): Promise<void>;
}
/**
 * The entry point for spawning child processes.
 * It emits the `close` and `error` events.
 * @example
 * ```typescript
 * import { Command } from '@tauri-apps/api/shell';
 * const command = new Command('node');
 * command.on('close', data => {
 *   console.log(`command finished with code ${data.code} and signal ${data.signal}`)
 * });
 * command.on('error', error => console.error(`command error: "${error}"`));
 * command.stdout.on('data', line => console.log(`command stdout: "${line}"`));
 * command.stderr.on('data', line => console.log(`command stderr: "${line}"`));
 *
 * const child = await command.spawn();
 * console.log('pid:', child.pid);
 * ```
 *
 * @since 1.1.0
 *
 */
declare class Command extends EventEmitter<'close' | 'error'> {
    /** @ignore Program to execute. */
    private readonly program;
    /** @ignore Program arguments */
    private readonly args;
    /** @ignore Spawn options. */
    private readonly options;
    /** Event emitter for the `stdout`. Emits the `data` event. */
    readonly stdout: EventEmitter<"data">;
    /** Event emitter for the `stderr`. Emits the `data` event. */
    readonly stderr: EventEmitter<"data">;
    /**
     * Creates a new `Command` instance.
     *
     * @param program The program name to execute.
     * It must be configured on `tauri.conf.json > tauri > allowlist > shell > scope`.
     * @param args Program arguments.
     * @param options Spawn options.
     */
    constructor(program: string, args?: string | string[], options?: SpawnOptions);
    /**
     * Creates a command to execute the given sidecar program.
     * @example
     * ```typescript
     * import { Command } from '@tauri-apps/api/shell';
     * const command = Command.sidecar('my-sidecar');
     * const output = await command.execute();
     * ```
     *
     * @param program The program to execute.
     * It must be configured on `tauri.conf.json > tauri > allowlist > shell > scope`.
     */
    static sidecar(program: string, args?: string | string[], options?: SpawnOptions): Command;
    /**
     * Executes the command as a child process, returning a handle to it.
     *
     * @returns A promise resolving to the child process handle.
     */
    spawn(): Promise<Child>;
    /**
     * Executes the command as a child process, waiting for it to finish and collecting all of its output.
     * @example
     * ```typescript
     * import { Command } from '@tauri-apps/api/shell';
     * const output = await new Command('echo', 'message').execute();
     * assert(output.code === 0);
     * assert(output.signal === null);
     * assert(output.stdout === 'message');
     * assert(output.stderr === '');
     * ```
     *
     * @returns A promise resolving to the child process output.
     */
    execute(): Promise<ChildProcess>;
}
/**
 * Opens a path or URL with the system's default app,
 * or the one specified with `openWith`.
 *
 * The `openWith` value must be one of `firefox`, `google chrome`, `chromium` `safari`,
 * `open`, `start`, `xdg-open`, `gio`, `gnome-open`, `kde-open` or `wslview`.
 *
 * @example
 * ```typescript
 * import { open } from '@tauri-apps/api/shell';
 * // opens the given URL on the default browser:
 * await open('https://github.com/tauri-apps/tauri');
 * // opens the given URL using `firefox`:
 * await open('https://github.com/tauri-apps/tauri', 'firefox');
 * // opens a file using the default program:
 * await open('/path/to/file');
 * ```
 *
 * @param path The path or URL to open.
 * This value is matched against the string regex defined on `tauri.conf.json > tauri > allowlist > shell > open`,
 * which defaults to `^https?://`.
 * @param openWith The app to open the file or URL with.
 * Defaults to the system default application for the specified path type.
 *
 * @since 1.0.0
 */
declare function open(path: string, openWith?: string): Promise<void>;
export { Command, Child, EventEmitter, open };
export type { ChildProcess, SpawnOptions };
