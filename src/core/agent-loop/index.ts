/**
 * Default agent driver (`ctx.agentLoop`).
 *
 * Implements the `Agent` contract from `@dsh-mini/agent` and owns the turn and
 * step lifecycle. It depends on services, never on concrete providers:
 * `sessions`, `systemPrompt`, `tools`, `llm`, and `agents`.
 *
 * Config:
 * - `maxSteps` — upper bound per turn
 * - `maxRetries` — failed model request retries
 *
 * TODO(phase-1):
 * - implement agent creation and teardown
 * - drive turn/step state in `loop.ts`
 * - publish streaming frames and durable settlements
 */
export {}
