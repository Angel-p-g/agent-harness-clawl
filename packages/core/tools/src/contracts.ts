/**
 * Tool contracts shared by the registry and tool packages.
 *
 * Planned types:
 * - `ParameterSchemaSpec` — compact argument DSL
 * - `ValueSchemaSpec` — canonical JSON result schema
 * - `ToolDefinition<Args, Value>` — name, description, schemas, render, execute
 * - `ToolExecution` — immutable identity, caller signal, agent handle
 * - `ToolResult` — normalized outcome, render blocks, optional metadata
 *
 * TODO(phase-1):
 * - define the types
 * - type-level argument inference from the parameter spec
 * - keep render/presentation pure so replay never performs I/O
 */
export {}
