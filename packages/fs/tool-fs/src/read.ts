/**
 * `read_file` tool definition.
 *
 * Contract:
 * - args: `{ path, offset?, limit? }`
 * - value: `{ path, offset, lines, totalLines, truncated }`
 * - render: line-numbered text
 *
 * The tool consumes `ctx.fs`; it never imports `fs-local`.
 *
 * TODO(phase-1):
 * - define the parameter and value schemas
 * - read through `ctx.fs.read()` with `exec.signal`
 * - clamp offset/limit and report truncation honestly
 * - return structured errors for missing files, directories, and non-text
 */
export {}
