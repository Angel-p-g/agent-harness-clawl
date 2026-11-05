# 实现路线图

原则：每一期都能独立验证，不把“跑起来”拖到最后。骨架阶段（Phase 0）已经完成，`src/` 中只有契约注释。

产品层方向（深度爬取与事件归因）见 [产品需求](product-requirements.md)；本文只覆盖 dsh-mini 骨架的实现顺序。

## Phase 0 — 骨架（已完成）

- workspace、tsconfig、包清单
- profile / bundle / patch 分层
- 三个工具与所有 seam 的包边界、服务键、事件名
- 架构与工具文档

验收：目录与清单完整；`pnpm typecheck` 能在安装依赖后通过（当前源码全为空模块）。

## Phase 1 — Cordis kernel

实现：

1. `core/scope`：scoped registration 原语。
2. `core/session`：内存 append-only log、`SessionEventMap`、`deriveMessages()`。
3. `core/tools`：`defineTool()`、注册表、参数与结果校验、执行流水线骨架。
4. `core/system-prompt`：section 注册、工具 schema 渲染。
5. `core/agent`：`Agent` 接口、注册表、`agent/*` 事件声明。
6. `core/agent-loop`：turn/step 状态机，使用假的 echo adapter 测试。

验收：

- 一个使用 echo adapter 的测试可以完成两轮 turn。
- 工具调用、结果回填、`tool/result` 顺序正确。
- 卸载插件后所有注册项消失。

## Phase 2 — CLI 与 composition

实现：

- `boot/app-boot`：读取 profile、展开 bundle、按层应用 patch。
- `apps/cli`：`dsh-mini headless`、`--patch`、`--dump-config`、`--once`。
- `--dump-config` 输出最终 entry 列表，便于调试层叠。

验收：

- `dsh-mini --dump-config` 打印 base bundle 的全部行。
- `--patch` 可以覆盖某行的 config。
- 缺少 profile / bundle 时给出明确错误。

## Phase 3 — `read_file`

实现：

- `fs/fs`：服务定义与 `fs/*` 事件。
- `fs/fs-local`：`readFile` / `stat` / `list`。
- `fs/tool-fs`：`read_file` 工具、行号渲染、offset/limit。
- 工作目录解析与路径展示。

验收：

- 读取大文件时遵守 limit 并标记 `truncated`。
- 不存在/目录/无权限返回结构化错误。
- 取消信号中断读取。

## Phase 4 — DeepSeek adapter

实现：

- `llm/llm`：消息、内容块、流事件、Adapter 接口。
- `llm/llm-deepseek`：OpenAI 兼容 chat completions、SSE 解析、工具调用增量拼接。
- 配置来自 env / bundle 行。
- `agent-loop` 接入真实 adapter。

验收：

- 单轮文本对话成功。
- 模型发起 `read_file` 调用并且 loop 能把结果送回模型。
- API 错误、超时、取消路径明确。

## Phase 5 — Web tools

实现：

- `web/web`：provider 注册与就绪检查。
- `web/web-fetch-http`：重定向、大小上限、超时、HTML 抽取。
- `web/web-search-brave`：Brave Search API 映射。
- `web/tool-web`：`web_search` / `web_fetch` schema、渲染、结构化错误。
- `web/*` 事件的默认策略（禁止私有地址等）。

验收：

- 无 key 时工具不进入 prompt，或执行时给出可读错误（二选一，需固定契约）。
- `web_fetch` 处理非 HTML 内容。
- 搜索结果与抓取结果都能回填到下一轮模型请求。

## Phase 6 — 打磨

- 统一错误格式与日志
- 超时 / 取消测试
- 简单 REPL 与 `--once` 输出
- 端到端 smoke test（mock LLM server）
- 文档补齐：插件作者指南、加一个 tool 的 cookbook
