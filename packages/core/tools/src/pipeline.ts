/**
 * Tool execution pipeline.
 *
 * Steps:
 * 1. detach and freeze model-generated arguments as lossless JSON
 * 2. validate arguments against the tool schema
 * 3. run `tools/pre-execute` policy
 * 4. run `tools/execute` wrappers around the tool body
 * 5. snapshot, validate, and freeze the canonical return value
 * 6. render model content and run `tools/post-execute`
 * 7. return a normalized result and emit `tools/result`
 *
 * TODO(phase-1):
 * - implement the pipeline in this order
 * - guarantee that a throw becomes a structured `isError` result
 * - prove that observers cannot mutate the canonical value
 */
export {}
