/**
 * Provider-agnostic model vocabulary.
 *
 * Planned types:
 * - `ChatMessage` — system | user | assistant | tool result
 * - `ContentBlock` — text | reasoning | tool call | image
 * - `ModelSelection` — provider, model, reasoning effort, context window
 * - `LlmRequest` — messages, tool declarations, sampling controls
 * - `StreamChunk` — text/reasoning delta, tool-call delta, usage, finish
 * - `LlmAdapter` — `prepare(selection)` plus capability metadata
 *
 * TODO(phase-1):
 * - define the types
 * - keep provider wire details out of this package
 * - document the tool-call delta assembly contract
 */
export {}
