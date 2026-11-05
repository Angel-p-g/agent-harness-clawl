/**
 * Application boot: profile resolution, bundle expansion, layer composition,
 * and Cordis loader startup.
 *
 * The boot layer is deliberately thin. It knows about package manifests and
 * YAML patches, not about sessions, tools, or models.
 *
 * Planned API:
 * - `resolveProfile(name, options) -> ResolvedProfile`
 * - `composeEntries(profile, overlays) -> Entry[]`
 * - `bootProfile(name, options) -> Promise<Context>`
 *
 * TODO(phase-2):
 * - implement profile resolution through `dsh.profile`
 * - implement bundle expansion through `dsh.bundle.patch`
 * - hand the final entry list to the loader
 * - support `--dump-config` without booting plugins
 */
export {}
