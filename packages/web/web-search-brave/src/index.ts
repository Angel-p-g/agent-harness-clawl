/**
 * Brave Search provider.
 *
 * Registers a `ctx.web` search provider backed by the Brave Search API.
 *
 * Planned config:
 * - `apiKeyEnv` — defaults to `BRAVE_SEARCH_API_KEY`
 * - `maxResults` — defaults to 5
 * - `timeoutMs` — defaults to 30000
 *
 * TODO(phase-1):
 * - register the provider during apply
 * - map Brave results to `SearchSource[]`
 * - report missing credentials through readiness, not a throw at boot
 * - handle rate limits and non-2xx responses as provider errors
 */
export {}
