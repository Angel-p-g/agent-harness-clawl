/**
 * Turn / step state machine.
 *
 * Shape:
 * ```text
 * turn/start
 *   claim input -> agent/pre-step -> step/start
 *     assemble prompt -> bind llm call -> stream
 *     assistant/message -> tool calls -> tool/result*
 *   step/end -> next step or turn-stopping -> turn/end
 * ```
 *
 * Invariants:
 * - one inbox feeds the driver
 * - a rejected first claim closes the turn without a step
 * - every started step settles exactly once
 * - tool calls without results are repaired before history is derived
 *
 * TODO(phase-1):
 * - implement the state machine
 * - add cancellation at every await boundary
 * - test empty, rejected, tool-using, and failed turns
 */
export {}
