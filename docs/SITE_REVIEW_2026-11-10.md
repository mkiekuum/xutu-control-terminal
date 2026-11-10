# 网站更新复核（2026-11-10）

每日公开文件检查运行42756439441成功发现editor.js与cloud.js变化并创建Issue #1；工作流显示failure是预期的review_required，不是静默放行。

差异包括计划状态筛选、文件侧栏固定按钮，以及管理员在列表中直接审核通过/退回的入口。新增审核按钮仍调用既有/api/plans/:id/review，沿用baseRevision、operation、decision、note；未发现本扩展已使用的接口契约变化。审核权限仍为真实admin，本账号不执行管理员正例。

对新旧editor.js分别调用原生validatePlan，五份已授权计划的工期、TE/TL、时差、关键边、节点完成时间完全一致；最新公开HTML的7个插件定位锚点均唯一存在。实际CLI只读上下文及计划写入回读已通过，详见TEST_REPORT.md。未声称新网站所有界面和管理员流程均实测。

复核后更新默认分支site-baseline.json，供后续每日检查使用。v2.1.0发布标签保持不变，发布源码内的基线代表打包时状态；持续监控使用仓库默认分支最新基线。本次无需修改已发布插件运行代码。公司Agent自动修复PR仍未接入。
