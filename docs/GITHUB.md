# GitHub发布与检测

个人公开仓库：https://github.com/mkiekuum/xutu-control-terminal

核心代码提交：3c499e63e67bfe49e0aa20ebe61138168939c94c。Windows/Ubuntu CI通过：https://github.com/mkiekuum/xutu-control-terminal/actions/runs/42749122434

每日公开资源检测已手动运行成功（未发现资源变化）：https://github.com/mkiekuum/xutu-control-terminal/actions/runs/42749125634 。工作流每天UTC02:23计划运行，不保证精确触发时间。

本轮发布使用v2.0.0-rc.1候选标签，浏览器清单版本2.0.0。发布入口：https://github.com/mkiekuum/xutu-control-terminal/releases/tag/v2.0.0-rc.1 。发布工作流先创建草稿，必须明确标为预发布后交付，不能称为30项全量稳定版。具体状态以GitHub页面为准。

发布资产：Chrome插件ZIP、Windows CLI/Native Messaging整合ZIP、完整源码ZIP、SHA256SUMS。Windows包不含本机launcher.json或bridge-config.json；安装时生成本机配置。

仓库默认分支codex/unified-terminal；未创建PR。这是用户自己的新仓库，不覆盖其他代码。原始附件、公司前端源码、真实业务记录、人员目录、会话及认证值不发布。LICENSE保留权利。

公司Agent自动修复PR尚未接入。每日检查可以报告差异并创建Issue，但本次未发生差异，未实测Issue/自动修复分支。CI不含生产账号凭据。
