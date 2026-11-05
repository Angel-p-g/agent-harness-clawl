/**
 * `web_fetch` tool definition.
 *
 * Contract:
 * - args: `{ url, maxChars? }`
 * - value: `{ url, finalUrl, contentType, title, content, truncated }`
 * - render: title, final URL, then extracted text
 *
 * TODO(phase-1):
 * - define the parameter and value schemas
 * - reject non-http(s) URLs before dispatch
 * - call `ctx.web.fetch()` with `exec.signal`
 * - truncate at `maxChars` and mark the result honestly
 */
export {}
