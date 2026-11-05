/**
 * Projection from durable session events to the model-visible message history.
 *
 * `deriveMessages()` must be pure: the same event array always produces the
 * same `ChatMessage[]`. System messages, user messages, assistant messages, and
 * tool results are folded in sequence order; pending tool calls without a
 * result are repaired or omitted according to a documented rule.
 *
 * TODO(phase-1):
 * - implement `deriveMessages(events)`
 * - handle failed steps with missing tool results
 * - add property tests for append/replay equivalence
 */
export {}
