/**
 * Tool-schema rendering for the system prompt.
 *
 * The model-facing declaration is derived from the same `ToolDefinition` used
 * by the registry; this module owns only the prompt projection and ordering.
 *
 * TODO(phase-1):
 * - define the stable tool ordering rule
 * - render JSON schema plus the tool description
 * - honor per-step admission filters (provider readiness, agent preset)
 */
export {}
