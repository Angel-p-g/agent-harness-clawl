# @dsh-mini/cli

`dsh-mini` 可执行入口。骨架阶段不启动 Cordis，直接抛出 `not implemented`。

## 计划中的命令

```sh
dsh-mini headless                 # 交互式 headless REPL
dsh-mini headless --once "..."    # 单轮执行
dsh-mini headless --dump-config   # 打印最终插件行
dsh-mini headless --patch ./x.yml # 追加一层 patch
```

## 启动流程

```text
argv
  → resolve profile (@dsh-mini/profile-headless)
  → expand bundles (@dsh-mini/bundle-base)
  → apply profile / home / CLI patches
  → new Context + loader
  → agent-loop handles turns
```

CLI 不直接 import 任何工具或模型适配器；它只依赖 `app-boot` 和 profile 包。
