/**
 * Durable session event vocabulary.
 *
 * Minimal set:
 * - `turn/start`, `turn/end`
 * - `step/start`, `step/end`
 * - `user/message`, `assistant/message`
 * - `tool/call`, `tool/result`
 *
 * Every event carries an id, a session id, a monotonically increasing sequence,
 * and a timestamp. Events are immutable once appended.
 *
 * TODO(phase-1):
 * - declare the `SessionEventMap` and payload types
 * - declare `session/event` through Cordis module augmentation
 * - document which events are required to reconstruct a model request
 */
export {}
