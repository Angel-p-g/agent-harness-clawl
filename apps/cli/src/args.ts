/**
 * Command-line argument parsing.
 *
 * Planned surface:
 * ```text
 * dsh-mini [profile] [options]
 *
 *   headless              profile name; defaults to "headless"
 *   --patch <file>        apply one extra patch layer (repeatable)
 *   --dump-config         print the composed entry list and exit
 *   --once <prompt>       run a single turn and print the result
 *   --cwd <path>          working directory for fs-local and runtime context
 *   --help, --version
 * ```
 *
 * TODO(phase-2):
 * - implement parsing without a CLI framework
 * - reject unknown flags with a usage message
 * - keep `--dump-config` side-effect free
 */
export {}
