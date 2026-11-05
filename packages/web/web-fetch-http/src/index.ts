/**
 * HTTP fetch provider.
 *
 * Registers a `ctx.web` fetch provider built on the platform `fetch`. Converts
 * HTML to plain text; returns non-HTML bodies according to their content type.
 *
 * Planned config:
 * - `timeoutMs` — defaults to 30000
 * - `maxBodyBytes` — defaults to 2 MiB
 * - `userAgent`
 *
 * TODO(phase-1):
 * - register the provider during apply
 * - follow a bounded number of redirects and report the final URL
 * - enforce the body cap while reading, not after
 * - extract title and readable text; strip scripts and styles
 */
export {}
