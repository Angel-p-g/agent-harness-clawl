/**
 * In-memory append-only event store.
 *
 * Contract:
 * - append is the only mutation
 * - sequence numbers are assigned by the store
 * - readers get immutable snapshots, never live arrays
 * - subscribers observe committed events in order
 *
 * TODO(phase-1):
 * - implement `MemorySessionStore`
 * - add sequence and duplicate-id checks
 * - add an async iterator for replay
 */
export {}
