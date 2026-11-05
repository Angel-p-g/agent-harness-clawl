/**
 * DeepSeek model adapter plugin.
 *
 * Registers an adapter on `ctx.llm`. Configuration is read from the plugin row,
 * with environment variables as the default source for secrets.
 *
 * Planned config:
 * - `apiKeyEnv` — defaults to `DEEPSEEK_API_KEY`
 * - `baseURL` — defaults to `https://api.deepseek.com`
 * - `model` — defaults to `deepseek-chat`
 * - `maxTokens`
 * - `contextWindow`
 *
 * TODO(phase-1):
 * - declare plugin config with schemastery
 * - register the adapter during apply
 * - fail with a clear error when the key is missing
 */
export {}
