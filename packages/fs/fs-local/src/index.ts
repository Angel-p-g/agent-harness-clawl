/**
 * Local filesystem provider.
 *
 * Implements the `ctx.fs` provider against `node:fs/promises`. Intentionally
 * unconfined in the skeleton: it can read anything the process can read. Path
 * confinement and approval belong to `fs/*` policy plugins or a sandbox provider.
 *
 * Planned config:
 * - `workingDirectory` — base for relative paths, defaults to `process.cwd()`
 *
 * TODO(phase-1):
 * - register the provider during apply
 * - implement read/stat/list with cancellation
 * - detect binary files and return a structured reason instead of garbage
 */
export {}
