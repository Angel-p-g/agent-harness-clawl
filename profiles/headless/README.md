# headless profile

一个 profile 就是一份命名的 composition：列出有序 bundle，并持有自己的 `cordis.patch.yml`。

```json
{ "dsh": { "profile": ["@dsh-mini/bundle-base"] } }
```

叠加顺序：

```text
@dsh-mini/bundle-base/cordis.patch.yml
  → profiles/headless/cordis.patch.yml
  → 用户 home patch
  → --patch 覆盖
```

本 profile 演示两件事：

1. profile 可以覆盖 bundle 中的行（`system-prompt`、`agent-loop`）。
2. 覆盖是整行替换：`system-prompt` 的 `includeRuntimeContext` 必须重述。

后续可以增加 `profiles/sdk`、`profiles/web`，而不改任何 package。
