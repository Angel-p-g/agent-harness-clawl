/**
 * Session log service (`ctx.sessions`).
 *
 * Owns the append-only `SessionEvent` log, an in-memory store for the minimal
 * composition, and the `session/event` broadcast. Persistence is deliberately
 * out of scope for the skeleton; the store interface is the seam a future JSONL
 * provider will implement.
 *
 * Planned API:
 * - `ctx.sessions.create(meta) -> SessionHandle`
 * - `handle.append(event)` — append one durable fact
 * - `handle.read() -> readonly SessionEvent[]`
 * - `handle.subscribe(listener)` — effect-scoped observation
 *
 * TODO(phase-1):
 * - implement the service and handle
 * - declare `SessionEventMap` in `events.ts`
 * - implement `deriveMessages()` in `history.ts`
 */
export {}
