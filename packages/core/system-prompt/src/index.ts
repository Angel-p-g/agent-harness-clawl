/**
 * System prompt assembly service (`ctx.systemPrompt`).
 *
 * Collects ordered sections contributed by plugins, renders admitted tool
 * schemas, and produces the system message for one step. Assembly is a pure
 * function over registered sections plus the step's tool snapshot.
 *
 * Planned API:
 * - `ctx.systemPrompt.section({ id, order, render })` — effect-scoped
 * - `ctx.systemPrompt.assemble({ tools, runtime }) -> string`
 *
 * TODO(phase-1):
 * - implement section registration with deterministic ordering
 * - include the harness persona and runtime context
 * - skip tools whose provider is not ready for the current step
 */
export {}
