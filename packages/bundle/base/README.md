# @dsh-mini/bundle-base

最小可用 agent 的共享基础层。`cordis.patch.yml` 是唯一的产品契约，本包不包含运行时逻辑。

## 插入的行

| 分组 | 行 |
|---|---|
| 时钟 | `timer` |
| 模型 | `llm`, `llm-deepseek` |
| 核心 | `session`, `system-prompt`, `tools` |
| 文件系统 | `fs`, `fs-local`, `tool-fs` |
| Web | `web`, `web-fetch-http`, `web-search-brave`, `tool-web` |
| Agent | `scope`, `agent`, `agent-loop` |

## 覆盖方式

上层 patch 通过 `id` 定位并替换整行 `config`：

```yaml
- id: agent-loop
  config:
    maxSteps: 30
    maxRetries: 2
```

不会做深合并。若要改一个字段，必须重述该行的完整配置。

## 不包含

持久化、UI、MCP、subagent、权限沙箱、上下文压缩、telemetry。这些能力通过新增插件行接入，而不是修改本 bundle。
