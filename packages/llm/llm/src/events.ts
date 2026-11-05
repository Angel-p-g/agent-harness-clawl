/**
 * `llm/stream` waterfall.
 *
 * Listeners may observe, transform, or replace the stream returned by a bound
 * prepared call. They must call `next()` to delegate. Retry, token metering,
 * and redaction are expected to be implemented as listeners here.
 *
 * TODO(phase-1):
 * - declare the event through Cordis module augmentation
 * - define the cancellation and error propagation contract
 */
export {}
