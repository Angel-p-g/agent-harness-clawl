/**
 * `web_search` tool definition.
 *
 * Contract:
 * - args: `{ query, count? }`
 * - value: `{ query, sources: [{ title, url, snippet }] }`
 * - render: a compact numbered source list
 *
 * TODO(phase-1):
 * - define the parameter and value schemas
 * - call `ctx.web.search()` with `exec.signal`
 * - cap result count and snippet length
 * - return a structured "provider not ready" error when unavailable
 */
export {}
