/**
 * Model-facing web tools: `web_search` and `web_fetch`.
 *
 * Owns schemas, validation, prompt guidance, limits, and presentation; never a
 * concrete provider. Registration is controlled by config, while readiness is
 * controlled by `ctx.web` at prompt-assembly time.
 *
 * Planned config:
 * - `search` — register `web_search`, defaults to true
 * - `fetch` — register `web_fetch`, defaults to true
 * - `searchMaxResults`
 * - `fetchMaxChars`
 * - `timeoutMs`
 *
 * TODO(phase-1):
 * - declare plugin config with schemastery
 * - register the enabled tools through `ctx.tools`
 * - add prompt guidance for source citation and fetch limits
 */
export {}
