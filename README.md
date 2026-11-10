> 最新状态：Windows优先，macOS暂缓；核心参数Schema、JSON Lines、计划快照和图依赖检查已加入。参见 [当前状态](docs/CURRENT_STATUS.md) 与 [Windows安装](docs/WINDOWS_INSTALL.md)。

# 序图控制终端 2.0.0 开发候选

**全量目标尚未完成，不是生产验收通过版。** 已编写真实源码与测试；当前仍缺后端/测试环境及部分功能。

入口：[安装](docs/INSTALL.md) · [详细终端手册](docs/TERMINAL_MANUAL.md) · [完整命令](docs/COMMAND_REFERENCE.md) · [49个示例](docs/COPY_PASTE_RECIPES.md) · [验收矩阵](docs/ACCEPTANCE.md) · [测试报告](docs/TEST_REPORT.md)。

开发测试先运行 pnpm install --frozen-lockfile。Node.js22+：`node --test tests/*.test.js`；`node tools/materials.mjs` 生成文档/示例；`node tools/build.mjs` 构建扩展 ZIP。Windows安装器：node native-host/install-windows.mjs EXTENSION_ID。macOS暂缓。

GitHub 工作流需要将本目录作为仓库根目录。公开发布前须完成权属与敏感数据审查。当前不包含公司保存页、原插件、网站源码或任何凭据。
