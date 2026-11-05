/**
 * Agent contract and live registry (`ctx.agents`).
 *
 * Owns the `Agent` handle plugins program against, the registry of live agents,
 * and creation/teardown ordering. The default driver lives in
 * `@dsh-mini/agent-loop`; consumers depend only on this package.
 *
 * Planned API:
 * - `ctx.agents.create(options) -> Agent`
 * - `ctx.agents.get(id) -> Agent | undefined`
 * - `Agent.run(input)` / `Agent.inject(context)` / `Agent.cancel()`
 *
 * TODO(phase-1):
 * - define the `Agent` interface and registry
 * - implement `agent/created` ordering before queued work starts
 * - keep durable inbox projection separate from live handles
 */
export {}
