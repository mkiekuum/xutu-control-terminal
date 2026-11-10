# 兼容性

2026-11-10 核对公开前端引用资源，API 取自实际 cloud.js/assignees-ui.js。未取得后端仓库；公司私有测试环境未提供。匿名 GET /api/session、/api/plans 返回401，证明没有借匿名请求绕过登录。浏览器只读检查已确认当前会话登录且当前计划可编辑；真实API权限和扩展写入尚未完成实测。

site-baseline.json 保存静态资源 SHA256，无业务 HTML。每日 workflow 检测变化，生成报告并去重创建 Issue；网络失败同样报告，不推断一定不兼容。资源变化需人工复核更新基线；当前没有公司 Agent 事件接入，自动修复 PR 未完成。

浏览器接口依据 [Chrome userScripts](https://developer.chrome.com/docs/extensions/reference/api/userScripts/) 和 [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)。最低Chrome135；138+需单独允许用户脚本。
