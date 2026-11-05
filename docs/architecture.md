# 架构设计

本文描述 `dsh-mini` 的目标架构。当前仓库只有骨架，文中所有行为均为待实现契约。

设计直接对照 deepseek-harness 的 [architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/HEAD/docs/architecture.md) 与 [cordis-primer.md](https://github.com/deepseek-ai/deepseek-harness/blob/HEAD/docs/cordis-primer.md)。实践入门见 [Cordis 教程](cordis-tutorial.md)。

## 1. Cordis 内核

Cordis v4 提供四样东西：

- **Context**：服务容器。插件从 `ctx` 上按 key 取服务，例如 `ctx.tools`、`ctx.llm`。
- **Service**：可被 `inject` 声明的依赖；服务未就绪时插件保持 pending。
- **Event**：typed events，支持 `emit` / `waterfall` / `parallel` / `serial` / `bail`。
- **Effect**：注册的可逆副作用。工具、prompt section、provider、监听器都在卸载时自动撤销。

`dsh-mini` 没有“主类”。CLI 只做三件事：解析参数、装配 profile、把插件行交给 Cordis loader。之后运行时结构完全是一棵插件树。

## 2. 服务地图

| 包 | 拥有的能力 | `ctx` key |
|---|---|---|
| `core/scope` | 按 agent 隔离的注册原语 | 无（库） |
| `core/session` | append-only `SessionEvent` 日志、内存 store、`deriveMessages()` | `ctx.sessions` |
| `core/system-prompt` | 有序 prompt section 与工具 schema 组装 | `ctx.systemPrompt` |
| `core/tools` | 作用域工具注册表、参数/结果 schema、守卫执行 | `ctx.tools` |
| `core/agent` | `Agent` 接口、活动注册表、`agent/*` 事件 | `ctx.agents` |
| `core/agent-loop` | 默认驱动器，实现 `Agent` 接口 | `ctx.agentLoop` |
| `llm/llm` | 消息/流词汇、Adapter seam | `ctx.llm` |
| `fs/fs` | 文件系统 seam 与 `fs/*` 策略事件 | `ctx.fs` |
| `web/web` | search / fetch provider seam 与就绪检查 | `ctx.web` |

`agent` 与 `agent-loop` 分离是有意的：工具和 UI 依赖 `agent` 的稳定契约，默认驱动可以被替换，而不会拖走消费者。

## 3. 事件域

沿用 deepseek-harness 的三分法：

### Session events（持久事实）

写进 session log，重启后仍可恢复：

```text
turn/start
step/start
user/message
assistant/message
tool/call
tool/result
step/end
turn/end
```

最小版本只实现这些。每条 `assistant/message` 保存组装后的完整消息；`tool/call` 与 `tool/result` 通过 `callId` 关联。

### Agent events（运行中的工作）

`agent/*` 事件携带活的 `Agent`，用于观察或拦截飞行中的请求：

| 事件 | 模式 | 用途 |
|---|---|---|
| `agent/created` | serial | Agent 创建完成，开始接收排队工作 |
| `agent/pre-step` | waterfall | 接受 / 改写 / 拒绝本轮输入 |
| `agent/request` | waterfall | 在请求发出前调整控制参数 |
| `agent/assistant-stream` | emit | 发布 start / chunk / end 流帧 |
| `agent/turn-stopping` | serial | turn 即将结束，可决定是否继续 |

Waterfall 监听器必须调用 `next()` 才会委托给下游；短路即拥有决定权。

### Capability events（策略与适配器）

- `tools/pre-execute`、`tools/execute`、`tools/post-execute`、`tools/result`
- `fs/read`、`fs/stat`（最小版本）；后续可加 `fs/write`、`fs/edit`
- `web/search`、`web/fetch`
- `llm/stream`

能力事件让策略和 provider 挂到 seam 上，而不需要 import agent loop。

## 4. Turn / Step 流程

- **step** = 一次模型请求 + 它触发的工具调用
- **turn** = 零个或多个 step，从第一条输入被 claim 开始，到没有任何未完成工作为止

```text
turn/start
  ├─ claim 下一条输入
  ├─ 组装 prompt sections + 已准入工具的 schema
  ├─ agent/pre-step ──reject──> 无 step，直接关闭 turn
  ├─ step/start
  ├─ agent/request
  ├─ 追加 user/message，冻结模型历史
  ├─ llm/stream ──> agent/assistant-stream{start,chunk*,end}
  ├─ assistant/message
  ├─ tool/call* ──> tools/pre-execute → tools/execute → tools/post-execute
  │                 → tool/result*
  ├─ step/end
  ├─ 还有工具结果待处理，或新输入到达？
  │    ├─ 是 → 下一个 step
  │    └─ 否 → agent/turn-stopping
  └─ turn/end
```

## 5. Session log 与历史推导

session log 是模型上下文的唯一来源：

```text
SessionEvent[] ──deriveMessages()──> ChatMessage[]
```

规则：

1. 只有写进 log 的东西才对模型可见。
2. 插件不得直接修改历史数组；需要改变模型所见内容时，注册纯投影或新增事件。
3. `deriveMessages()` 是纯函数，便于测试、回放和后续持久化。
4. 最小版本使用内存 store；接口预留 `append()` / `read()` / `subscribe()`，之后可以无痛接 JSONL。

## 6. 工具流水线

工具作者只写一个 `defineTool()` 定义；注册表负责校验、派发和归一化。

```text
model tool_call
  → 参数 JSON 快照 + 冻结
  → tools/pre-execute   允许 / 拒绝 / 询问
  → tools/execute       超时、重试、指标、沙箱
  → tool.execute(args, exec)
  → 返回值 JSON 快照 + schema 校验
  → tools/post-execute  替换呈现内容 / 阻断 / 附加模型上下文
  → tool/result         持久化归一化结果
```

约束：

- `execute()` 接收已经通过 schema 校验的参数。
- `execute()` 只能返回一个与 `output.schema` 匹配的 JSON 值；人类可读文本由 `render()` 生成。
- 必须尊重 `exec.signal` 的取消。
- 抛出异常或返回非法值 → `isError: true`。
- 注册通过 effect 完成，插件卸载即注销。

## 7. Capability seams

一个 seam 由三种角色组成：

1. **Service Definition**：`ctx.fs`、`ctx.web`、`ctx.llm` 的接口。
2. **Service Provider**：`fs-local`、`web-fetch-http`、`web-search-brave`、`llm-deepseek`。
3. **Consumer**：`tool-fs`、`tool-web`、`agent-loop`。

最小版本每个 seam 只有一个 provider，但调用方只依赖接口。替换 provider 时工具与 agent loop 不变。

### LLM seam

```text
ctx.llm.register(adapter)
adapter.prepare(modelSelection) → PreparedCall
PreparedCall.stream(messages, tools, signal) → AsyncIterable<StreamChunk>
```

`StreamChunk` 统一表达文本增量、推理增量、工具调用增量、usage 与结束原因。DeepSeek 适配器只负责把 OpenAI 兼容 SSE 映射到这套词汇。

### FS seam

```text
ctx.fs.read(path, options) → FileContent
ctx.fs.stat(path)          → FileStat
ctx.fs.list(path)          → DirEntry[]
```

后续策略监听 `fs/*` 事件即可加入根目录限制、忽略规则、审批，而不需要改 `tool-fs`。

### Web seam

```text
ctx.web.registerSearch(provider)
ctx.web.registerFetch(provider)
ctx.web.searchReady() / fetchReady()
```

工具在 provider 未就绪时仍可见，但执行时返回结构化错误。这样模型能理解“工具存在但当前不可用”，而不是看到工具凭空消失。

## 8. Composition

### Bundle

一个 bundle 是「一段 Cordis 配置行 + 它们依赖的代码」的分发单位。`package.json` 声明：

```json
{ "dsh": { "bundle": { "patch": "./cordis.patch.yml" } } }
```

`cordis.patch.yml` 是 patch 列表：

```yaml
- insert:
    - id: session
      name: '@dsh-mini/session'
    - id: tools
      name: '@dsh-mini/tools'
```

### Profile

一个 profile 是命名的 composition，列出有序 bundle，并持有自己的 patch：

```json
{ "dsh": { "profile": ["@dsh-mini/bundle-base"] } }
```

### 叠加顺序

```text
空 entry 列表
  → bundle[0].patch
  → bundle[1].patch
  → profile/cordis.patch.yml
  → 用户 home patch
  → --patch 覆盖
```

规则：

- `insert` 追加行。
- 通过 `id` 定位的行整体替换 `config`，不做深合并。
- 行顺序不表达加载顺序；激活由服务和 `inject` 决定。
- 同一个运行时行为只在一个层里定义，避免“半覆盖”的配置。

## 9. 最小 composition

`packages/bundle/base/cordis.patch.yml` 的插件行：

```text
timer
llm ── llm-deepseek
session
system-prompt
tools
fs ── fs-local
web ── web-fetch-http ── web-search-brave
tool-fs  → read_file
tool-web → web_search, web_fetch
scope
agent
agent-loop
```

`profiles/headless/cordis.patch.yml` 覆盖 persona 与 loop 上限，演示 profile 层优先级。

## 10. 明确不做的事

骨架阶段不实现，且不预留伪实现：

- 流式 UI / Web / 桌面 / ACP
- MCP 与外部工具协议
- subagent、agent team、workflow
- 上下文压缩、token meter、session title
- 会话持久化与 fork/resume
- sandbox、approval、credentials、telemetry
- plugin market、HMR、settings

这些能力都可以在对应 seam 上以新插件加入，不需要改核心包。

## 11. 包依赖方向

```text
cordis
  ↑
core/scope ← core/session ← core/system-prompt ← core/tools ← core/agent ← core/agent-loop
                                                        ↑
llm/llm ← llm/llm-deepseek                               │
fs/fs ← fs/fs-local ← fs/tool-fs ────────────────────────┤
web/web ← web providers ← web/tool-web ──────────────────┘

boot/app-boot → @cordisjs/plugin-loader
apps/cli → boot/app-boot + profiles/headless
```

禁止反向依赖：provider 不 import 工具，工具不 import 具体 provider，driver 不 import 具体适配器。
