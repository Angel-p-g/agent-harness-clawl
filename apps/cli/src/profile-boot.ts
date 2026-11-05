/**
 * CLI-to-boot glue.
 *
 * Resolves the requested profile, composes bundle and overlay patches, and
 * starts the Cordis loader. Headless-specific behavior (REPL, `--once`) stays in
 * the CLI; the boot layer owns only composition.
 *
 * TODO(phase-2):
 * - call `bootProfile()` from `@dsh-mini/app-boot`
 * - implement the headless REPL and `--once` runner
 * - forward cancellation and shutdown to the agent
 */
export {}
