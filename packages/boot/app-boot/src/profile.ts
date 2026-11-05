/**
 * Profile resolution.
 *
 * A profile is a package whose manifest declares:
 * ```json
 * { "dsh": { "profile": ["@dsh-mini/bundle-base"] } }
 * ```
 *
 * It lives in the workspace during development and in the Harness home for an
 * installed product. Resolution must reject missing bundles with a message that
 * names the profile and the offending dependency.
 *
 * TODO(phase-2):
 * - locate a profile package by name
 * - validate the `dsh.profile` field
 * - produce an ordered, deduplicated bundle list
 */
export {}
