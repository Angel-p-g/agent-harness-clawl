/**
 * Entry-list patch application.
 *
 * Supported operations, matching deepseek-harness:
 * - `{ insert: Entry[] }` — append rows
 * - `{ id, ...fields }` — replace the addressed row's whole config
 *
 * Layers are applied in order: bundles, profile patch, home patch, CLI overlay.
 * The last write wins; no deep merge. Inserted rows are indexed immediately so
 * a later patch in the same layer can address them.
 *
 * TODO(phase-2):
 * - implement the patch algorithm
 * - validate duplicate ids per layer
 * - preserve `!!js` expressions until plugin activation
 * - add a fixture test for insert-then-patch within one layer
 */
export {}
