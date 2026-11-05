/**
 * Base bundle marker module.
 *
 * The bundle's contract is `cordis.patch.yml`, not this module. The entry point
 * exists so the package is a valid workspace member and can be resolved by the
 * loader; it contributes no runtime plugin.
 *
 * TODO(phase-2):
 * - export manifest types (`BundleManifest`) if boot tooling needs them
 * - keep this module free of side effects
 */
export {}
