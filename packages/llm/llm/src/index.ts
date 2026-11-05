/**
 * Model adapter seam (`ctx.llm`).
 *
 * Provides the provider-agnostic message vocabulary and the binding between a
 * model selection and a prepared call. Concrete adapters (DeepSeek, ...) are
 * registered here; the agent loop never imports one.
 *
 * Planned API:
 * - `ctx.llm.register(adapter)` — effect-scoped
 * - `ctx.llm.prepare(selection) -> PreparedCall`
 * - `PreparedCall.stream(request, signal) -> AsyncIterable<StreamChunk>`
 *
 * TODO(phase-1):
 * - define the adapter registry and selection resolution
 * - define `PreparedCall` and streaming
 * - add deterministic adapter fixtures for loop tests
 */
export {}
