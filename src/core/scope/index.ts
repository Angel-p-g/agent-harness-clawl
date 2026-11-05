/**
 * Scoped registration primitive.
 *
 * Provides the per-agent isolation layer that the session, tools, prompt, and
 * agent registries build on. A scoped registration is an ordinary Cordis effect
 * attached to a child context, so it unwinds with the agent that owns it.
 *
 * TODO(phase-1):
 * - define `Scope` and `ScopedRegistration<T>` handles
 * - provide `createScope(parent, key)` factory
 * - route scoped events to the owning scope before the global listeners
 * - prove disposal ordering with a unit test
 */
export {}
