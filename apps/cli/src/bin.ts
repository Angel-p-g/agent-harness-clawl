#!/usr/bin/env node
/**
 * Executable entry point.
 *
 * Planned flow:
 * 1. parse arguments (`args.ts`)
 * 2. resolve the profile and compose the entry list (`profile-boot.ts`)
 * 3. start the Cordis loader
 * 4. run one prompt (`--once`) or open the headless REPL
 *
 * The skeleton deliberately stops here: no Cordis context is created and no
 * package is imported, so running this file fails loudly instead of pretending
 * to work.
 *
 * TODO(phase-2):
 * - implement the planned flow
 * - print actionable startup diagnostics on failure
 * - drain and dispose the context on SIGINT / SIGTERM
 */
throw new Error('dsh-mini: CLI bootstrap is not implemented yet (skeleton only)')

export {}
