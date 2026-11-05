/**
 * `tools/*` event declarations.
 *
 * Waterfalls (listeners must call `next()`):
 * - `tools/pre-execute` — allow / deny / ask
 * - `tools/execute` — deadline, retry, metrics, sandbox wrapper
 * - `tools/post-execute` — replace content, block, attach context
 *
 * Observation:
 * - `tools/result` — immutable normalized outcome
 *
 * TODO(phase-1):
 * - declare the event map through Cordis module augmentation
 * - document dispatch modes in JSDoc `@mode` tags
 */
export {}
