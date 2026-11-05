/**
 * Web provider contracts.
 *
 * Planned types:
 * - `SearchProvider` — `search(query, { count, signal }) -> SearchSource[]`
 * - `FetchProvider` — `fetch(url, { maxChars, signal }) -> FetchResult`
 * - `SearchSource` — title, url, snippet
 * - `FetchResult` — final URL, contentType, title, content, truncated
 * - `WebReady` — readiness reason for prompt admission
 *
 * TODO(phase-1):
 * - define the types
 * - keep HTTP, HTML parsing, and vendor payloads inside providers
 */
export {}
