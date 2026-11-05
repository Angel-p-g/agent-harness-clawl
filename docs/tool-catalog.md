# 工具契约

当前计划中的三个模型可见工具。全部通过 `ctx.tools.register()` 以 effect 形式注册；schema 同时进入系统提示词。

## `read_file`

读取本地文本文件。由 `@dsh-mini/tool-fs` 注册，消费 `ctx.fs`。

参数：

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Absolute path, or a path relative to the working directory."
    },
    "offset": {
      "type": "integer",
      "minimum": 1,
      "description": "1-based line to start from. Defaults to 1."
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "description": "Maximum number of lines to return. Defaults to 2000."
    }
  },
  "required": ["path"],
  "additionalProperties": false
}
```

规范化返回值：

```json
{
  "path": "/abs/path/file.ts",
  "offset": 1,
  "lines": [
    { "number": 1, "text": "import ..." }
  ],
  "totalLines": 42,
  "truncated": false
}
```

模型可见文本由 `output.render` 生成，建议带行号。文件不存在、无权限、是目录等基础设施错误抛异常，由注册表转成 `isError`。

## `web_search`

由 `@dsh-mini/tool-web` 注册，消费 `ctx.web` 的 search provider（骨架默认 Brave）。

参数：

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query."
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "description": "Number of results. Defaults to 5."
    }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

规范化返回值：

```json
{
  "query": "cordis plugin framework",
  "sources": [
    {
      "title": "Cordis",
      "url": "https://github.com/cordiverse/cordis",
      "snippet": "..."
    }
  ]
}
```

## `web_fetch`

由 `@dsh-mini/tool-web` 注册，消费 `ctx.web` 的 fetch provider（骨架默认 HTTP）。

参数：

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "Absolute http(s) URL."
    },
    "maxChars": {
      "type": "integer",
      "minimum": 1000,
      "maximum": 200000,
      "description": "Maximum characters of extracted text. Defaults to 50000."
    }
  },
  "required": ["url"],
  "additionalProperties": false
}
```

规范化返回值：

```json
{
  "url": "https://example.com/article",
  "finalUrl": "https://example.com/article",
  "contentType": "text/html",
  "title": "Example",
  "content": "Extracted text...",
  "truncated": false
}
```

约束：

- 只允许 `http:` / `https:`。
- 尊重 `maxChars` 与响应体积上限。
- HTML 转纯文本；后续可替换为 Markdown 转换。
- 超时、非 2xx、DNS/连接失败属于基础设施错误，抛异常。
- 私有地址 / localhost 的拦截属于 `web/fetch` 策略事件，不写死在工具里。

## 注册形态（目标）

```ts
// 仅为设计示意，骨架阶段不包含实现
ctx.tools.register(defineTool({
  name: 'read_file',
  description: 'Read a text file from disk.',
  parameters: { ... },
  output: {
    schema: { ... },
    render: (_args, value) => [{ type: 'text', text: renderLines(value) }],
  },
  async execute(args, exec) {
    return ctx.fs.read(args.path, { signal: exec.signal, ... })
  },
}))
```

## 工具可见性规则

- provider 未配置时，工具仍注册，但 `ctx.web.searchReady()` / `fetchReady()` 为 false。
- `core/system-prompt` 在组装一步的请求时跳过未就绪的 web 工具，避免模型调用必然失败的工具。
- 工具配置里可以单独关闭：`tool-web` 的 `search` / `fetch` 开关，`tool-fs` 的 `read` 开关。
