/**
 * DeepSeek chat-completions adapter.
 *
 * Maps the provider's OpenAI-compatible streaming responses onto the shared
 * `StreamChunk` vocabulary:
 * - `choices[].delta.content` -> text delta
 * - `choices[].delta.reasoning_content` -> reasoning delta
 * - `choices[].delta.tool_calls[]` -> accumulated tool-call deltas
 * - `usage` -> usage chunk
 * - `finish_reason` -> finish chunk
 *
 * TODO(phase-1):
 * - build the request from `ChatMessage[]` and tool declarations
 * - parse SSE incrementally and handle partial lines
 * - assemble streamed tool-call arguments
 * - map HTTP and stream errors to typed adapter failures
 * - honor the caller's cancellation signal
 */
export {}
