# 测试报告

2026-11-10，Windows，Node.js v24.22.1。本地58项通过、0失败、0跳过，证据见[test-results.tap](test-results.tap)。覆盖统一命令、53份示例、标准JSON Schema、DAG/精度/编号、合并拆分、权限负例、UUID去重键、服务端回读、合成HTTP冲突、Native Messaging长连接、Windows EXE、AI合成提供商和MCP协议。

真实安装与网站验证另见[LIVE_TEST_RESULTS.md](LIVE_TEST_RESULTS.md)：43个步骤符合预期，其中4个预期拒绝。合成HTTP服务不是公司后端；单测不能代替真实验收。

目前总体仍未达到30项全部通过，限制见[ACCEPTANCE.md](ACCEPTANCE.md)。GitHub双平台CI实际状态见GITHUB.md及最终报告。
