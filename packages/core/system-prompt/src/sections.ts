/**
 * Ordered prompt sections.
 *
 * Sections are the extension point for plugin-authored guidance. Ordering is a
 * stable `(order, id)` tuple; equal order values keep registration order.
 *
 * TODO(phase-1):
 * - define `PromptSection` and the registry
 * - implement render coalescing and newline normalization
 * - expose `sectionsSnapshot()` for debugging and tests
 */
export {}
