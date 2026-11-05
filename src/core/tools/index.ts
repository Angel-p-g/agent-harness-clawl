/**
 * Tool registry and guarded execution pipeline (`ctx.tools`).
 *
 * Owns tool definitions, argument/result schemas, scoped registration, the
 * `tools/pre-execute -> tools/execute -> tools/post-execute` waterfalls, and
 * normalized `tool/result` outcomes.
 *
 * Planned API:
 * - `defineTool(definition)` — typed model-facing tool definition
 * - `ctx.tools.register(tool)` — effect-scoped registration
 * - `ctx.tools.schemas()` — snapshot for prompt assembly
 * - `ctx.tools.execute(batch, options)` — guarded execution
 *
 * TODO(phase-1):
 * - implement the registry and typed `defineTool()`
 * - validate arguments before execute and values after execute
 * - implement cancellation, timeouts, and error normalization
 */
export {}
