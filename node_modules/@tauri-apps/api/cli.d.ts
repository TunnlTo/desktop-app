/**
 * @since 1.0.0
 */
interface ArgMatch {
    /**
     * string if takes value
     * boolean if flag
     * string[] or null if takes multiple values
     */
    value: string | boolean | string[] | null;
    /**
     * Number of occurrences
     */
    occurrences: number;
}
/**
 * @since 1.0.0
 */
interface SubcommandMatch {
    name: string;
    matches: CliMatches;
}
/**
 * @since 1.0.0
 */
interface CliMatches {
    args: {
        [name: string]: ArgMatch;
    };
    subcommand: SubcommandMatch | null;
}
/**
 * Parse the arguments provided to the current process and get the matches using the configuration defined [`tauri.cli`](https://tauri.app/v1/api/config/#tauriconfig.cli) in `tauri.conf.json`
 * @example
 * ```typescript
 * import { getMatches } from '@tauri-apps/api/cli';
 * const matches = await getMatches();
 * if (matches.subcommand?.name === 'run') {
 *   // `./your-app run $ARGS` was executed
 *   const args = matches.subcommand?.matches.args
 *   if ('debug' in args) {
 *     // `./your-app run --debug` was executed
 *   }
 * } else {
 *   const args = matches.args
 *   // `./your-app $ARGS` was executed
 * }
 * ```
 *
 * @since 1.0.0
 */
declare function getMatches(): Promise<CliMatches>;
export type { ArgMatch, SubcommandMatch, CliMatches };
export { getMatches };
