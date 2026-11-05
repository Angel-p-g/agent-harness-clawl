/**
 * Filesystem seam (`ctx.fs`).
 *
 * Declares the small set of operations the minimal agent needs. Policy belongs
 * to `fs/*` event listeners, not to tools; a future sandbox provider can
 * implement the same interface without changing `tool-fs`.
 *
 * Planned API:
 * - `ctx.fs.read(path, options) -> FileContent`
 * - `ctx.fs.stat(path) -> FileStat`
 * - `ctx.fs.list(path) -> DirEntry[]`
 * - `ctx.fs.register(provider)` — effect-scoped provider registration
 *
 * TODO(phase-1):
 * - define the service and provider interface
 * - emit `fs/read` and `fs/stat` capability events
 * - normalize path handling and cancellation
 */
export {}
