# Cordis 教程：构建持续并发的网络爬取 Agent

本文以「持续、并发地抓取网络信息」为主线，逐层介绍 Cordis v4 的插件、服务、依赖注入、事件与可逆副作用。示例基于 `cordis@4.0.0-rc.12`，只保留理解机制所需的最少代码。

目标 Agent 的结构如下：

```text
定时器 / 链接发现 ──add(url)──▶ 队列 ──▶ N 个 worker ──fetch──▶ HTTP
                                            │
                                            └── crawl/result ──▶ Agent / 工具
```

它需要四类能力：

| 能力 | Cordis 机制 |
|---|---|
| 抓取 HTTP 页面 | `Service`：`ctx.fetchPage` |
| 控制并发与队列 | 普通类 + `Service`：`ctx.crawl` |
| 抓取前改写、抓取后观察 | `Event`：`crawl/before-fetch`、`crawl/result` |
| 定时触发、卸载时停止 | `Effect`：`ctx.effect()` |

示例文件可直接用项目本地工具链运行：

```sh
./.local/node/bin/node --import tsx/esm crawler.ts
```

以下各节按依赖顺序给出最小片段，第 7 节把它们组装为同一个 `crawler.ts`。

## 1. 最小插件与可逆副作用

Cordis 应用从 `new Context()` 开始，所有行为都通过 `ctx.plugin()` 挂载。插件拿到的是自己的上下文；在这个上下文里注册的副作用会在卸载时自动撤销。

```ts
import { Context } from 'cordis'

const ctx = new Context()

const fiber = await ctx.plugin((ctx) => {
  const timer = setInterval(() => console.log('tick'), 1000)
  ctx.effect(() => () => clearInterval(timer))
})

await new Promise((resolve) => setTimeout(resolve, 2500))
await fiber.dispose()
```

`ctx.effect()` 接收一个返回清理函数的回调。`fiber.dispose()` 卸载插件时，`clearInterval` 自动执行，不需要在业务代码里手工维护停止逻辑。示例中的 2.5 秒等待只是为了观察输出；真实服务通常由外部信号决定何时卸载。示例用 `console` 便于直接观察；在 dsh-mini 插件里可改用 `ctx.logger` 并配置 exporter。

插件可以是函数、带 `apply()` 的对象，或类；三种形式在后续示例中都会出现。

## 2. Service：能力即服务

爬取能力由 `FetchService` 提供。它继承 `Service`，在构造函数里用 `super(ctx, 'fetchPage')` 注册到 `ctx.fetchPage`。

```ts
import { Context, Service } from 'cordis'

declare module 'cordis' {
  interface Context {
    fetchPage: FetchService
  }
}

class FetchService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'fetchPage')
  }

  async fetch(url: string, signal: AbortSignal): Promise<string> {
    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return response.text()
  }
}

const ctx = new Context()
await ctx.plugin(FetchService)

const body = await ctx.fetchPage.fetch('https://example.com', AbortSignal.timeout(30_000))
console.log(body.length)
```

`declare module 'cordis'` 只是类型补全；运行时注册发生在 `super()` 里。服务本身也是插件，因此可以像其他插件一样被加载、替换和卸载。把 HTTP 实现换成带缓存或代理的 provider 时，消费者只依赖 `ctx.fetchPage`，不需要改代码。

## 3. inject：依赖驱动激活

消费者不应该关心服务在什么时候加载，只声明自己需要什么：

```ts
import { Context } from 'cordis'

const worker = {
  inject: ['fetchPage'],
  apply(ctx: Context) {
    console.log('fetchPage ready')
  },
}

const ctx = new Context()
const fiber = await ctx.plugin(worker) // 依赖未就绪，插件保持 pending
await ctx.plugin(FetchService)        // 服务就绪后自动激活 worker
await fiber.dispose()
```

`inject` 可以写在插件对象上，也可以写成服务类的静态字段：

```ts
class CrawlService extends Service {
  static inject = ['fetchPage']
  // ...
}
```

由此得到两个重要性质：

1. 插件行的顺序不表达加载顺序。先把 `CrawlService` 加载进来，它只会保持 pending；等 `fetchPage` 出现后自动激活。
2. 依赖消失时消费者会随之卸载。替换 provider 不会留下悬挂的监听器或定时器。

## 4. Event：策略与结果

抓取前需要改写 URL、拦截域名；抓取后需要通知 Agent、写 session、更新指标。这些都不应该塞进 `CrawlService`，而是挂到事件上。

```ts
import { Context } from 'cordis'

interface CrawlRequest {
  url: string
}

interface CrawlResult {
  url: string
  body: string
}

declare module 'cordis' {
  interface Events {
    'crawl/before-fetch'(request: CrawlRequest, next: () => CrawlRequest): CrawlRequest
    'crawl/result'(result: CrawlResult): void
  }
}

const ctx = new Context()

ctx.on('crawl/before-fetch', (request, next) => {
  request.url = request.url.replace('http://', 'https://')
  return next()
})

ctx.on('crawl/result', ({ url, body }) => {
  console.log(`${url} (${body.length} bytes)`)
})

const request = { url: 'http://example.com' }
const accepted = ctx.waterfall('crawl/before-fetch', request, () => request)
ctx.emit('crawl/result', { url: accepted.url, body: '<html>…</html>' })
```

要点：

- `ctx.on()` 注册的监听器同样属于可逆副作用。写在插件 `apply()` 里时，插件卸载会自动移除。
- `waterfall` 按注册顺序调用监听器，每个监听器必须调用 `next()` 才会继续；不调用即短路，由它决定结果。
- `next()` 不接收参数，因此改写通过共享的 `request` 对象完成；最后一个参数是无人处理时的兜底函数。
- `emit` 是同步广播；需要等待所有异步观察者时改用 `ctx.parallel()`。

## 5. 有界并发爬取服务

「高并发」不等于把所有 URL 一次性丢给 `Promise.all`。正确做法是固定数量的 worker 从队列取任务，使同时进行的请求数不超过 \(N\)。

下面的实现沿用上一节的 `CrawlRequest`、`CrawlResult` 与事件声明。

```ts
import { Context, Service } from 'cordis'

class CrawlService extends Service {
  static inject = ['fetchPage']

  private queue: string[] = []
  private seen = new Map<string, number>()
  private active = 0
  private maxQueue = 1024
  private ttl = 10 * 60_000
  private controller = new AbortController()

  constructor(ctx: Context, private concurrency = 8) {
    super(ctx, 'crawl')
    ctx.effect(() => () => {
      this.queue.length = 0
      this.controller.abort()
    })
  }

  add(url: string): boolean {
    const last = this.seen.get(url)
    if (
      (last !== undefined && Date.now() - last < this.ttl) ||
      this.queue.length >= this.maxQueue
    ) return false

    this.seen.set(url, Date.now())
    this.queue.push(url)
    this.pump()
    return true
  }

  private pump() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const url = this.queue.shift()!
      this.active++
      void this.run(url)
        .catch((error) => console.warn(error))
        .finally(() => {
          this.active--
          this.pump()
        })
    }
  }

  private async run(url: string) {
    const request = { url }
    const target = this.ctx.waterfall('crawl/before-fetch', request, () => request)
    const body = await this.ctx.fetchPage.fetch(target.url, this.controller.signal)
    this.ctx.emit('crawl/result', { url: target.url, body } satisfies CrawlResult)
  }
}
```

这段代码维持四个不变量：

1. **并发有界。** `active < concurrency` 才允许取新任务，最多 \(N\) 个请求同时在飞。
2. **失败归还槽位。** 无论成功、失败还是中止，`finally` 都会递减 `active` 并再次 `pump()`，不会因为一个坏 URL 卡住整个池。
3. **去重有窗口。** 同一 URL 在 `ttl` 内只抓一次，过期后可重新抓取；队列超过上限时拒绝新任务，形成背压。
4. **卸载可停止。** `ctx.effect` 清空队列并中止在途请求；`FetchService` 收到的 `signal` 会让 `fetch` 立即退出。

`console.warn(error)` 只记录单个任务的失败。网络失败是常态，不应该让整个 Agent 停止。

`ctx.parallel()` 并行的是事件监听器，不会替调度 URL；抓取并发始终由 `CrawlService` 的 worker 池控制。

注意，`seen` 在入队时就写入，因此失败过的 URL 在 TTL 内不会重试。生产实现应只在成功后确认去重标记，或把失败 URL 放入带退避的重试队列。

## 6. 持续运行：定时器与队列

持续抓取不需要 `while (true)`。定时器只负责把种子 URL 放进队列，真正的抓取仍由 worker 池完成：

```ts
import { Context } from 'cordis'

const scheduler = {
  inject: ['crawl'],
  apply(ctx: Context) {
    ctx.effect(() => {
      const timer = setInterval(() => {
        ctx.crawl.add('https://example.com/feed')
      }, 60_000)
      return () => clearInterval(timer)
    })
  },
}
```

定时器包在 `ctx.effect()` 里，`scheduler` 卸载时自动调用 `clearInterval`。`inject` 声明 `crawl`，因此只有抓取服务就绪后，这个插件才会开始计时。dsh-mini 的基础 bundle 用 `@cordisjs/plugin-timer` 提供同样的能力；当 `timer` 服务可用时，也可以写成 `ctx.interval(...)`，生命周期语义相同。

`CrawlService` 的 TTL 是 10 分钟，因此同一个 feed 大约每 10 分钟重新抓取一次；60 秒的 tick 在 TTL 内会被去重。调整 tick 间隔与类中的 `ttl` 字段即可控制刷新频率。

回调里只做入队，不执行 `await fetch()`。这样即使上一轮抓取尚未完成，定时器也不会产生重叠的抓取批次。

持续性的另一个来源是链接发现：每抓到一页，就把其中的链接重新入队。下面的 Agent 插件同时负责消费结果和扩展队列：

```ts
const agent = {
  inject: ['crawl'],
  apply(ctx: Context) {
    ctx.on('crawl/result', ({ url, body }) => {
      console.log(`${url} (${body.length} bytes)`)
      for (const link of extractLinks(body, url)) ctx.crawl.add(link)
    })
  },
}

function extractLinks(body: string, base: string): string[] {
  const links = [...body.matchAll(/href="([^"]+)"/g)]
    .map((match) => new URL(match[1]!, base).href)
  return [...new Set(links)]
}
```

`extractLinks` 只是演示用的正则实现；真实项目应使用 HTML 解析器，并过滤协议、域名和重复链接。`crawl.add()` 的队列有上限，但 `seen` 是 Map，过期条目不会自动删除，仍需按生产清单定期清理。

## 7. 组装 Agent

所有插件通过 `ctx.plugin()` 组合。由于 `inject` 已经声明了依赖，加载顺序不影响最终行为：

```ts
import { Context } from 'cordis'

const ctx = new Context()
await ctx.plugin(FetchService)
await ctx.plugin(CrawlService, 8)
await ctx.plugin(scheduler)
await ctx.plugin(agent)
```

这是一段长驻装配：定时器会持续向队列投放种子。需要停止时，对相应插件的 fiber 调用 `dispose()`，或由宿主进程统一退出。

这段装配对应四个可独立替换的部分：

- `FetchService`：HTTP provider。可以换成带缓存、代理或浏览器渲染的实现。
- `CrawlService`：调度与并发控制。消费者只调用 `add()`。
- `scheduler`：种子来源。除了定时器，也可以由消息、RSS 或模型决定。
- `agent`：消费 `crawl/result`，把页面交给模型或工具，并决定是否继续发现链接。

在完整的 dsh-mini 中，agent loop 可以通过工具调用 `ctx.crawl.add()`，并在 `crawl/result` 监听器里把结果写入 session；本文只保留 Cordis 侧的服务与事件接线。

若要把它们包成 dsh-mini 插件，只需把类与对象放进各自的包，再在 `cordis.patch.yml` 中插入对应的行；插件之间的依赖仍由 `inject` 和事件契约表达，不需要一个中心调度器。

## 8. 生产化检查清单

上面的实现刻意保持最小。投入真实抓取前，至少补上：

- **每主机限速。** 全局并发 \(N\) 之外，再按 host 限制并发与 QPS，遵守 `robots.txt` 与站点条款。
- **超时与体积上限。** 为每个请求设置 `AbortSignal.timeout()`，并限制响应体大小；dsh-mini 的 `web-fetch-http` 默认是 30 秒 / 2 MiB。
- **重试与退避。** 只对网络错误、`429` 和 `5xx` 重试，使用指数退避并尊重 `Retry-After`。
- **去重集合有界。** `seen` 已有 TTL，但 Map 仍会保留过期条目；需要定期清理或设置容量上限。
- **背压策略。** 队列满时选择丢弃、等待还是降低种子频率，必须明确；静默丢弃会掩盖上游过载。
- **结果载荷。** `crawl/result` 携带完整页面会放大内存；生产应限制大小，或只传递存储引用。
- **优雅退出。** 停止接收新任务，调用 `abort()`，等待在途请求结束后再关闭进程。
- **安全边界。** 只允许 `http`/`https`，拒绝内网地址，防止 SSRF；对页面内容做编码与大小校验。
- **可观测性。** 至少暴露 `active`、队列长度、成功/失败计数，并区分超时、HTTP 错误与解析错误。

这些能力都可以继续以 Cordis 插件的形式接入：限速是 `crawl/before-fetch` 上的策略，指标是 `crawl/result` 的监听器，持久化则替换 `CrawlService` 内部的结果出口。核心包无需修改。
