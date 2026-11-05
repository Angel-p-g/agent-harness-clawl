/**
 * Web capability seam (`ctx.web`).
 *
 * Owns provider registration for search and fetch, plus per-step readiness.
 * Tools stay registered when a provider is unavailable, but prompt assembly may
 * omit them for that step and execution returns a structured error.
 *
 * Planned API:
 * - `ctx.web.registerSearch(provider)` — effect-scoped
 * - `ctx.web.registerFetch(provider)` — effect-scoped
 * - `ctx.web.searchReady()` / `ctx.web.fetchReady()`
 * - `ctx.web.search(query, options)` / `ctx.web.fetch(url, options)`
 *
 * TODO(phase-1):
 * - define provider interfaces and readiness rules
 * - emit `web/search` and `web/fetch` capability events
 * - define single-provider selection for the minimal composition
 */
export {}
