/**
 * `agent/*` live event declarations.
 *
 * - `agent/created` (serial)
 * - `agent/pre-step` (waterfall: accept / rewrite / reject claimed input)
 * - `agent/request` (waterfall: adjust request controls)
 * - `agent/assistant-stream` (emit: start / chunk / end frames)
 * - `agent/turn-stopping` (serial: decide whether the turn continues)
 *
 * TODO(phase-1):
 * - declare the event map through Cordis module augmentation
 * - document which payload fields are live handles versus durable ids
 */
export {}
