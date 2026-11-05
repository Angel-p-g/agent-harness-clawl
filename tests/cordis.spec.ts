import assert from 'node:assert/strict'
import test from 'node:test'
import { Context, Service } from 'cordis'

type Message =
  | { role: 'user'; content: string }
  | { role: 'tool'; content: string }

type Reply =
  | { type: 'search'; query: string }
  | { type: 'text'; text: string }

interface Source {
  title: string
  url: string
  snippet: string
}

interface RunResult {
  answer: string
  sources: Source[]
}

declare module 'cordis' {
  interface Context {
    llm: FakeLlm
    web: FakeWeb
    searchAgent: SearchAgent
  }
}

/**
 * Scripted stand-in for a model adapter. Each `request` consumes one reply,
 * so the test can pin the exact LLM/tool/LLM sequence.
 */
class FakeLlm extends Service {
  readonly calls: Message[][] = []

  constructor(ctx: Context, private script: Reply[]) {
    super(ctx, 'llm')
  }

  async request(messages: readonly Message[]): Promise<Reply> {
    this.calls.push([...messages])
    await Promise.resolve()
    const reply = this.script.shift()
    if (!reply) throw new Error('script exhausted')
    return reply
  }
}

class FakeWeb extends Service {
  readonly queries: string[] = []

  constructor(ctx: Context) {
    super(ctx, 'web')
  }

  async search(query: string): Promise<Source[]> {
    this.queries.push(query)
    return [{
      title: 'Cordis',
      url: 'https://cordis.example/plugins',
      snippet: `result for ${query}`,
    }]
  }
}

class SearchAgent extends Service {
  static inject = ['llm', 'web']

  constructor(ctx: Context) {
    super(ctx, 'searchAgent')
  }

  async run(question: string): Promise<RunResult> {
    const messages: Message[] = [{ role: 'user', content: question }]

    const decision = await this.ctx.llm.request(messages)
    if (decision.type !== 'search') throw new Error('expected a search call')

    const sources = await this.ctx.web.search(decision.query)
    messages.push({ role: 'tool', content: JSON.stringify(sources) })

    const answer = await this.ctx.llm.request(messages)
    if (answer.type !== 'text') throw new Error('expected a text answer')

    return { answer: answer.text, sources }
  }
}

test('composes an LLM request with web search through Cordis services', async () => {
  const ctx = new Context()
  await ctx.plugin(FakeWeb)
  const script: Reply[] = [
    { type: 'search', query: 'cordis plugin framework' },
    { type: 'text', text: 'Cordis composes plugins through services.' },
  ]
  await ctx.plugin(FakeLlm, script)
  const agentFiber = await ctx.plugin(SearchAgent)

  const result = await ctx.searchAgent.run('What is Cordis?')

  assert.deepEqual(ctx.web.queries, ['cordis plugin framework'])
  assert.equal(ctx.llm.calls.length, 2)
  assert.deepEqual(ctx.llm.calls[0], [
    { role: 'user', content: 'What is Cordis?' },
  ])
  assert.deepEqual(ctx.llm.calls[1]![0], {
    role: 'user',
    content: 'What is Cordis?',
  })
  assert.equal(ctx.llm.calls[1]![1]!.role, 'tool')
  assert.match(ctx.llm.calls[1]![1]!.content, /cordis\.example\/plugins/)
  assert.deepEqual(result, {
    answer: 'Cordis composes plugins through services.',
    sources: [{
      title: 'Cordis',
      url: 'https://cordis.example/plugins',
      snippet: 'result for cordis plugin framework',
    }],
  })

  await agentFiber.dispose()
})

test('inject keeps the agent pending until both services are ready', async () => {
  const ctx = new Context()
  const agentFiber = await ctx.plugin(SearchAgent)

  assert.equal(ctx.get('searchAgent'), undefined)

  await ctx.plugin(FakeWeb)
  assert.equal(ctx.get('searchAgent'), undefined)

  await ctx.plugin(FakeLlm, [{ type: 'text', text: 'ready' }] satisfies Reply[])
  assert.ok(ctx.searchAgent)

  await agentFiber.dispose()
  assert.equal(ctx.get('searchAgent'), undefined)
})
