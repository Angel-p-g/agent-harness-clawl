/**
 * `fs/*` capability events.
 *
 * Minimal set:
 * - `fs/read` — policy and observation before a read
 * - `fs/stat` — policy and observation before metadata access
 *
 * Future: `fs/write`, `fs/edit`, `fs/list`. The event domain lets a sandbox or
 * approval policy attach without importing `tool-fs`.
 *
 * TODO(phase-1):
 * - declare the events through Cordis module augmentation
 * - define whether each is a waterfall or observation event
 */
export {}
