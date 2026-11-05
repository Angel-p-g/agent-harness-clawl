# dsh-mini

一个按 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 架构风格组织、基于 [Cordis](https://github.com/cordiverse/cordis) v4 的最小 Agent Harness。

> 非官方项目，与 DeepSeek 无关。仓库目前处于 **骨架阶段**：只有包结构、清单、composition 和设计文档，`src/` 下故意没有任何实现。

## 目标

做出一个最小但真实可用的 headless agent：

- 一个 agent loop（turn / step 生命周期）
- 一个 DeepSeek 模型适配器
- 三个模型可见工具：`read_file`、`web_search`、`web_fetch`
- 所有能力都是 Cordis 插件，可由 YAML 替换或摘除
- profile + bundle 分层 composition，和 deepseek-harness 一样从空插件树开始装配

不做：Web UI、桌面端、MCP、subagent、持久化会话、权限沙箱、上下文压缩。

## 当前状态

| 部分 | 状态 |
|---|---|
| 目录 / workspace / tsconfig | ✅ 骨架完成 |
| 包清单与依赖关系 | ✅ 骨架完成 |
| Cordis composition（bundle / profile） | ✅ 骨架完成 |
| 设计文档与工具契约 | ✅ 骨架完成 |
| 项目本地 Node/pnpm 与依赖安装 | ✅ 已完成 |
| 与 deepseek-harness 的 Node/pnpm/TS 配置对齐 | ✅ 已完成（Cordis 有意偏离，见下文） |
| `pnpm typecheck` / `pnpm test` | ✅ 通过 |
| `src/**` 实现 | ⬜ 全部为 TODO |
| 可运行 CLI | ⬜ `bin.ts` 会抛 `not implemented` |

## 设计原则

沿用 deepseek-harness 的五条核心约束：

1. **一切皆插件。** 模型适配器、工具注册表、session log、agent loop 都是可替换插件，没有需要打补丁的特权内核。
2. **服务通过 `ctx.<key>` 协作。** 插件依赖服务键而不是具体实现，加载顺序由 `inject` 声明驱动，而不是手工排序。
3. **事件是扩展点。** 会话事件持久、agent 事件描述运行中的工作、能力事件（`fs/*`、`tools/*`、`web/*`）挂载策略与适配器。
4. **注册即可逆副作用。** 工具、prompt section、provider、listener 都通过 `ctx.effect()` / `ctx.on()` 安装，插件卸载时自动回滚。
5. **模型可见即可重建。** 发给模型的每个输入都必须能从 session log 推导出来。

## 架构一览

```text
apps/cli
  └─ profile: headless            profiles/headless
       └─ bundle: base            packages/bundle/base
            ├─ kernel services    core/{scope,session,system-prompt,tools,agent,agent-loop}
            ├─ model seam         llm/llm + llm/llm-deepseek
            ├─ capability seams   fs/fs + fs/fs-local
            │                     web/web + web/web-fetch-http + web/web-search-brave
            └─ model-facing tools fs/tool-fs, web/tool-web
```

Cordis 插件树是唯一的运行时结构。CLI 只负责选择 profile、按层叠加 patch、启动 loader；所有产品行为都在插件行里。

## 目录结构

```text
dsh-mini/
├── apps/cli/                    # 可执行入口：参数、profile 解析、loader 启动
├── profiles/headless/           # profile：列出 bundle，持有 profile 级 patch
├── src/                         # 根级示例：main.ts、env.d.ts、core 占位接口
├── packages/
│   ├── boot/app-boot/           # profile → bundle → patch 的装配逻辑
│   ├── bundle/base/             # 共享基础层：全部核心插件行
│   ├── core/scope/              # 按 agent 隔离的 scoped registration
│   ├── core/session/            # append-only SessionEvent log（最小实现为内存）
│   ├── core/system-prompt/      # prompt section + tool schema 组装
│   ├── core/tools/              # 工具注册表与守卫执行流水线
│   ├── core/agent/              # Agent 接口、注册表、agent/* 事件
│   ├── core/agent-loop/         # 默认驱动器：turn/step 状态机
│   ├── llm/llm/                 # 消息/流词汇与 Adapter seam
│   ├── llm/llm-deepseek/        # DeepSeek（OpenAI 兼容）适配器
│   ├── fs/fs/                   # 文件系统服务定义与 fs/* 事件
│   ├── fs/fs-local/             # 本地文件系统 provider
│   ├── fs/tool-fs/              # read_file 工具
│   ├── web/web/                 # search/fetch provider seam
│   ├── web/web-fetch-http/      # HTTP fetch provider（HTML → text）
│   ├── web/web-search-brave/    # Brave Search provider
│   └── web/tool-web/            # web_search + web_fetch 工具
├── docs/architecture.md         # 详细架构与事件/数据流
├── docs/tool-catalog.md         # 三个工具的模型契约
└── docs/roadmap.md              # 分期实现计划
```

## 最小 composition

`packages/bundle/base/cordis.patch.yml` 以 deepseek-harness 的方式向空插件列表插入一行行插件：

```text
timer
llm                  llm-deepseek
session
system-prompt
tools
fs                   fs-local
web                  web-fetch-http, web-search-brave
tool-fs              → read_file
tool-web             → web_search, web_fetch
scope
agent
agent-loop
```

profile 与 bundle 的叠加顺序：

```text
bundle patches → profile cordis.patch.yml → 用户 patch → --patch 覆盖
```

后写入的行按 `id` 覆盖前一层；`insert` 只能追加。行顺序本身不表达加载顺序，激活由服务可用性和 `inject` 驱动。

## 工具面

| 工具 | 由谁注册 | 依赖 seam | 说明 |
|---|---|---|---|
| `read_file` | `@dsh-mini/tool-fs` | `ctx.fs` | 读取本地文本文件，支持 offset/limit |
| `web_search` | `@dsh-mini/tool-web` | `ctx.web.search` | 返回标题、URL、摘要 |
| `web_fetch` | `@dsh-mini/tool-web` | `ctx.web.fetch` | 抓取 URL 并转成纯文本/Markdown |

详细 schema 见 [docs/tool-catalog.md](docs/tool-catalog.md)。

## 本地工具链（安装在项目内）

Node.js、npm、pnpm 全部安装在 `dsh-mini/.local/`，不会写入系统目录：

```text
.local/
├── node/          # Node.js v24.22.2
├── pnpm/          # pnpm 11.28.5
├── bin/           # node / npm / npx / corepack / pnpm / pnpx
├── corepack/      # COREPACK_HOME (project-local)
├── npm-cache/
├── pnpm-cache/
└── pnpm-store/    # content-addressable store
```

`.local/` 已加入 `.gitignore`。仓库另提供可复现的安装脚本：

```sh
./scripts/install-toolchain.sh
source ./scripts/env.sh
```

依赖安装：

```sh
source ./scripts/env.sh
pnpm install        # node_modules 位于项目根和每个 workspace 包内
pnpm typecheck
pnpm test
pnpm dsh headless   # 目前按设计抛出 not implemented
```

> 依赖安装使用 pnpm。workspace 内部依赖写的是 pnpm 的 `workspace:*` 协议，npm 不支持该协议（会报 `EUNSUPPORTEDPROTOCOL`）。npm 仅用于把 pnpm 安装到 `.local/`，以及日常的 registry 调试。

### Source-first 开发

所有 workspace 包的 `main` / `types` 都指向 `src/index.ts`，由 `tsx` 直接加载 TypeScript，因此 **Phase 1 写跨包 import 不需要先构建**。生产构建（输出 `lib/` 并让 `bin` 可用）留到 Phase 6；`apps/cli` 的 `bin` 字段仍指向未来的 `lib/bin.js`。

## 运行时要求

- `DEEPSEEK_API_KEY`（模型）
- `BRAVE_SEARCH_API_KEY`（搜索；`web_fetch` 不需要）

参考 [.env.example](.env.example)。

## 网页请求测试

[tests/web-request.spec.ts](tests/web-request.spec.ts) 接收一个 URL，抓取响应体后：

1. 用 js-beautify 自动缩进、换行，保存为 UTF-8 HTML；
2. 用 MarkItDown 的 HTML 规则把同一份 HTML 转成 Markdown，保存到项目根目录的 `output/`。

```sh
# 不传 TEST_URL：使用本地 HTTP fixture，适合离线跑 pnpm test
pnpm test

# 抓取指定 URL：HTML 与 Markdown 路径都会打印在测试日志里
TEST_URL=https://example.com pnpm test:web
```

HTML 输出目录是 `tests/.artifacts/web/`，Markdown 输出目录是 `output/`，两者都已加入 `.gitignore`。文件名直接由 URL 推导：`host + path + query`，非法字符替换为 `_`。例如：

```text
https://www.btsj6.com/subject/njowq0n.html
-> tests/.artifacts/web/www.btsj6.com_subject_njowq0n.html
-> output/www.btsj6.com_subject_njowq0n.md
```

HTML 格式化使用 2 空格缩进、120 列换行；默认超时 30 秒、响应体上限 2 MiB，与 `web-fetch-http` 的规划默认值一致。

### Markdown 转换

转换完全在 TypeScript 中完成，不依赖 Python、外部进程或官方 `markitdown` CLI：

- [`turndown`](https://github.com/mixmark-io/turndown) 负责 HTML → Markdown；
- [`@joplin/turndown-plugin-gfm`](https://github.com/laurent22/joplin/tree/dev/packages/turndown-plugin-gfm) 提供表格、删除线、任务列表等 GFM 扩展；
- [tests/support/markdown.ts](tests/support/markdown.ts) 复刻 MarkItDown 的 HTML 规则：ATX 标题、只取 body、丢弃 `script`/`style`/`title`、保留链接与图片 title、截断 `data:` 图片、过滤 `javascript:` 链接。

其他测试可以直接复用两个 helper：

```ts
import { readFile } from 'node:fs/promises'
import { saveMarkdown } from './support/markdown.ts'
import { fetchHtmlToFile } from './support/web-request.ts'

const snapshot = await fetchHtmlToFile('https://example.com')
console.log(snapshot.filePath) // 绝对路径，例如 tests/.artifacts/web/example.com_index.html

const markdown = await saveMarkdown(
  await readFile(snapshot.filePath, 'utf8'),
  'https://example.com',
)
console.log(markdown.filePath) // 绝对路径，例如 output/example.com_index.md
```

## 与 deepseek-harness 的版本对齐

工具链与编译器选项按 harness 的 `package.json`、`tsconfig.base.json` 和 `docs/development.md` 对齐：

| 项目 | deepseek-harness | dsh-mini | 状态 |
|---|---|---|---|
| Node.js | `>=24.9.0`（CI 覆盖 24.9 / 最新 24 / 26） | 24.22.2（`.local`） | ✅ 兼容 |
| pnpm | `11.28.5`（`packageManager` + devDependency） | 11.28.5（`.local` + `packageManager` + devDependency） | ✅ 一致 |
| TypeScript | `^6.0.3` | `^6.0.3` | ✅ 一致 |
| tsx | `^4.23.13` | `^4.23.13` | ✅ 一致 |
| vitest | `^4.1.11` | `^4.1.11` | ✅ 一致 |
| @types/node | `^22.20.1` | `^22.20.1` | ✅ 一致 |
| tsconfig 语义选项 | `es2024` / `esnext` / `bundler` / `composite` / `incremental` / `allowImportingTsExtensions` / `rewriteRelativeImportExtensions` / `verbatimModuleSyntax: false` / `noUnused*` / `noFallthroughCasesInSwitch` / 所有 workspace 包 `paths` | 同左 | ✅ 一致 |
| pnpm 构建脚本白名单 | `allowBuilds`（默认拒绝） | `allowBuilds: { esbuild: true }` | ✅ 同形 |
| TypeScript peer 范围 | `>=5 <7` | `>=5 <7` | ✅ 一致 |
| Corepack | 文档要求 Corepack 启用的 pnpm | 本地 Node 自带 Corepack 0.36.0，但直接使用 `.local/bin/pnpm` | ⚠️ 等价 |
| Git | `>=2.26`（lefthook / hooks 需要） | 当前环境未安装 | ⚠️ 骨架不需要 |
| Cordis | vendored `@deepseek-ai/cordis@4.0.0-rc.11` + loader rc.5 + include 1.0.4 | 公共 `cordis@4.0.0-rc.12` + loader rc.9 + include 1.2.0 | ⚠️ 有意偏离 |

说明：

- **Node / pnpm 已对齐。** 24.22.2 落在 harness 支持的 Node 24 线上；pnpm 版本逐字一致，依赖安装、frozen lockfile 和构建脚本白名单行为相同。
- **编译器语义已对齐。** `tsconfig.base.json` 现在使用 harness 的 `target`、`module`、`moduleResolution`、严格性开关和 `@dsh-mini/*` 源路径映射。相对导入按 harness 习惯写显式 `.ts` 后缀，由 `rewriteRelativeImportExtensions` 在构建时改写为 `.js`。根 `tsconfig.json` 仍是 `noEmit` 的单程序检查；harness 的 solution + project references 构建拓扑属于后续生产构建阶段，不影响当前源码开发。
- **Corepack 未启用。** `.local` 里已经有固定版本的 pnpm 可执行文件，`packageManager` 字段也固定为 11.28.5，因此行为等价；如果希望完全走 harness 的 Corepack 流程，执行 `corepack enable` 即可。
- **Git 暂未安装。** 当前没有 `postinstall` / lefthook / git-backed 功能，骨架不依赖 Git；接入 hooks 或 workspace diff 能力前需要补装 Git 2.26+。
- **Cordis 版本是有意偏离。** harness 使用自己 vendor 并打过本地补丁的 `@deepseek-ai/cordis@4.0.0-rc.11`，不是公共 npm 上的 `cordis`；dsh-mini 使用公共 `cordis@4.0.0-rc.12`。两者同属 4.0.0-rc 代际，骨架用到的 Context / Service / 事件 / effect API 在公共 rc.12 中都存在。`loader` 与 `include` 跟随公共 Cordis 的 peer 版本（rc.9 / 1.2.0），不能单独降到 harness 的 rc.5 / 1.0.4。Phase 1 的业务代码只依赖 `ctx` 和事件契约，不依赖 fork 私有补丁；如果后续需要 harness 的 loader 补丁，再单独评估 vendor。

验证命令：

```sh
source ./scripts/env.sh
CI=true pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
node --import tsx/esm --input-type=module -e "await import('@dsh-mini/llm')"
```

## 与 deepseek-harness 的取舍

为了保持“最小”，骨架主动丢掉了很多东西，但保留了它们的 seam 形状：

- session 只有内存实现，后续可加 JSONL persistence
- 每个 seam 只提供一个 provider（DeepSeek / local fs / HTTP fetch / Brave）
- 没有 HMR、plugin market、settings UI
- 没有 MCP、subagent、agent team、workflow、compaction
- 没有 sandbox / approval / credentials 层；`fs-local` 直接访问进程可访问的路径
- boot 逻辑简化为「数组 patch + 按 id 覆盖」

这些省略不影响后续按 harness 的方式把能力逐个插回来。

## 文档

- [架构设计](docs/architecture.md)
- [Cordis 教程：持续并发爬取 Agent](docs/cordis-tutorial.md)
- [产品需求：深度信息爬取与事件归因](docs/product-requirements.md)
- [工具契约](docs/tool-catalog.md)
- [实现路线图](docs/roadmap.md)
