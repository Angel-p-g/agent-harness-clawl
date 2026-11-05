/**
 * Model-facing filesystem tools. The minimal composition registers only
 * `read_file`; the package is the future home of write/edit as well.
 *
 * Planned config:
 * - `read` — register `read_file`, defaults to true
 * - `defaultLimit` — default line count, defaults to 2000
 *
 * TODO(phase-1):
 * - declare plugin config with schemastery
 * - register `read_file` through `ctx.tools`
 * - keep rendering pure for replay
 */
export {}
