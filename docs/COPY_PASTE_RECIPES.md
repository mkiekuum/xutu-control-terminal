# 53份完整可复制示例

TEST_*是占位值，请换成真实授权测试对象。写操作会改变服务器记录；必须保留真实依赖和验收点。每个新作业换requestId，重放旧ID不会重复执行。示例不证明真实账号已通过验收。

## 1. 查看版本

适用条件：无需网站登录，只读取扩展版本

预期：调用 system.version 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-01",
  "steps": [
    {
      "id": "s1",
      "op": "system.version",
      "params": {}
    }
  ]
}
~~~

## 2. 查看能力

适用条件：读取实现范围，不代表当前账号授权

预期：调用 system.capabilities 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-02",
  "steps": [
    {
      "id": "s1",
      "op": "system.capabilities",
      "params": {}
    }
  ]
}
~~~

## 3. 检测页面锚点

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 site.inspect 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-03",
  "steps": [
    {
      "id": "s1",
      "op": "site.inspect",
      "params": {}
    }
  ]
}
~~~

## 4. 读取当前登录态

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 site.session 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-04",
  "steps": [
    {
      "id": "s1",
      "op": "site.session",
      "params": {}
    }
  ]
}
~~~

## 5. 列出计划

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.list 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-05",
  "steps": [
    {
      "id": "s1",
      "op": "plan.list",
      "params": {}
    }
  ]
}
~~~

## 6. 按编号读取计划

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.get 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-06",
  "steps": [
    {
      "id": "s1",
      "op": "plan.get",
      "target": {
        "number": "TEST-001"
      },
      "params": {}
    }
  ]
}
~~~

## 7. 按 ID 读取计划

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.get 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-07",
  "steps": [
    {
      "id": "s1",
      "op": "plan.get",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 8. 创建空白草稿

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.create 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-08",
  "steps": [
    {
      "id": "s1",
      "op": "plan.create",
      "params": {
        "title": "合成测试草稿",
        "number": "TEST-001",
        "nodes": [],
        "edges": []
      }
    }
  ]
}
~~~

## 9. 创建原生网络草稿

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.create 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-09",
  "steps": [
    {
      "id": "s1",
      "op": "plan.create",
      "params": {
        "title": "合成三点估时",
        "number": "TEST-002",
        "nodes": [
          {
            "id": "1",
            "name": "开始"
          },
          {
            "id": "2",
            "name": "完成"
          }
        ],
        "edges": [
          {
            "fromNodeId": "1",
            "toNodeId": "2",
            "estimateDays": {
              "minimum": 1,
              "likely": 2,
              "maximum": 3
            },
            "dashed": false
          }
        ]
      }
    }
  ]
}
~~~

## 10. 转换旧任务，暂不写入

适用条件：转换结果在 data.plan；检查 losses 后再构造 plan.create，不自动写入

预期：调用 convert.legacyToNative 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-10",
  "steps": [
    {
      "id": "s1",
      "op": "convert.legacyToNative",
      "params": {
        "title": "合成任务",
        "unit": "hour",
        "start": "2026-11-10T09:00",
        "workers": [],
        "tasks": [
          {
            "id": "a",
            "name": "A",
            "duration": 2
          }
        ]
      }
    }
  ]
}
~~~

## 11. 修改标题

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.update 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-11",
  "steps": [
    {
      "id": "s1",
      "op": "plan.update",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "set": {
          "title": "合成新名称"
        }
      }
    }
  ]
}
~~~

## 12. 修改日期

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 schedule.updateInputs 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-12",
  "steps": [
    {
      "id": "s1",
      "op": "schedule.updateInputs",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "set": {
          "startDate": "2026-11-10",
          "deadlineDate": "2026-11-20"
        }
      }
    }
  ]
}
~~~

## 13. 读取节点

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 node.list 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-13",
  "steps": [
    {
      "id": "s1",
      "op": "node.list",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 14. 新增节点

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 node.create 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-14",
  "steps": [
    {
      "id": "s1",
      "op": "node.create",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "id": "3",
        "name": "验收"
      }
    }
  ]
}
~~~

## 15. 更新节点

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 node.update 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-15",
  "steps": [
    {
      "id": "s1",
      "op": "node.update",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "id": "3",
        "set": {
          "name": "最终验收",
          "content": "合成说明"
        }
      }
    }
  ]
}
~~~

## 16. 重排节点

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 node.reorder 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-16",
  "steps": [
    {
      "id": "s1",
      "op": "node.reorder",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "ids": [
          "2",
          "1",
          "3"
        ]
      }
    }
  ]
}
~~~

## 17. 删除无连线节点

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 node.remove 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-17",
  "steps": [
    {
      "id": "s1",
      "op": "node.remove",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "id": "3"
      }
    }
  ]
}
~~~

## 18. 读取连线

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 edge.list 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-18",
  "steps": [
    {
      "id": "s1",
      "op": "edge.list",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 19. 新增连线

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 edge.create 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-19",
  "steps": [
    {
      "id": "s1",
      "op": "edge.create",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "2",
        "estimateDays": {
          "minimum": 1,
          "likely": 2,
          "maximum": 3
        }
      }
    }
  ]
}
~~~

## 20. 修改三点估时

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 edge.update 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-20",
  "steps": [
    {
      "id": "s1",
      "op": "edge.update",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "2",
        "estimateDays": {
          "minimum": 0.001,
          "likely": 0.002,
          "maximum": 0.003
        }
      }
    }
  ]
}
~~~

## 21. 设置虚线

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 edge.update 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-21",
  "steps": [
    {
      "id": "s1",
      "op": "edge.update",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "2",
        "dashed": true,
        "estimateDays": {
          "minimum": 0,
          "likely": 0,
          "maximum": 0
        }
      }
    }
  ]
}
~~~

## 22. 删除连线

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 edge.remove 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-22",
  "steps": [
    {
      "id": "s1",
      "op": "edge.remove",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "2"
      }
    }
  ]
}
~~~

## 23. 读取进度

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 progress.read 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-23",
  "steps": [
    {
      "id": "s1",
      "op": "progress.read",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 24. 设置实际完成日期

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 progress.complete 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-24",
  "steps": [
    {
      "id": "s1",
      "op": "progress.complete",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "2",
        "actualCompleteDate": "2026-11-12"
      }
    }
  ]
}
~~~

## 25. 复制为草稿

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.copy 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-25",
  "steps": [
    {
      "id": "s1",
      "op": "plan.copy",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "number": "TEST-COPY",
        "title": "合成副本"
      }
    }
  ]
}
~~~

## 26. 导出服务端 JSON

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.export 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-26",
  "steps": [
    {
      "id": "s1",
      "op": "plan.export",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 27. 移入垃圾桶

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 plan.archive 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-27",
  "steps": [
    {
      "id": "s1",
      "op": "plan.archive",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 28. 查看审核状态

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 review.status 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-28",
  "steps": [
    {
      "id": "s1",
      "op": "review.status",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 29. 提交审核

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 review.submit 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-29",
  "steps": [
    {
      "id": "s1",
      "op": "review.submit",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 30. 管理员审核通过

适用条件：仅测试管理员、合成计划；改变审核状态

预期：调用 review.approve 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-30",
  "steps": [
    {
      "id": "s1",
      "op": "review.approve",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {}
    }
  ]
}
~~~

## 31. 管理员退回

适用条件：仅测试管理员、合成计划；改变审核状态

预期：调用 review.reject 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-31",
  "steps": [
    {
      "id": "s1",
      "op": "review.reject",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "note": "合成测试意见"
      }
    }
  ]
}
~~~

## 32. 列出项目组

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 project.list 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-32",
  "steps": [
    {
      "id": "s1",
      "op": "project.list",
      "params": {}
    }
  ]
}
~~~

## 33. 创建测试项目组

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 project.create 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-33",
  "steps": [
    {
      "id": "s1",
      "op": "project.create",
      "params": {
        "number": "TEST-GROUP",
        "name": "合成项目",
        "owner": "TEST_OWNER"
      }
    }
  ]
}
~~~

## 34. 项目分配

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 project.assignPlan 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-34",
  "steps": [
    {
      "id": "s1",
      "op": "project.assignPlan",
      "params": {
        "planId": "TEST_PLAN_ID",
        "groupId": "TEST_GROUP_ID"
      }
    }
  ]
}
~~~

## 35. 人员目录

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 user.list 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-35",
  "steps": [
    {
      "id": "s1",
      "op": "user.list",
      "params": {}
    }
  ]
}
~~~

## 36. 管理员查看可见性分组

适用条件：需服务器实际允许的管理员角色

预期：调用 group.list 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-36",
  "steps": [
    {
      "id": "s1",
      "op": "group.list",
      "params": {}
    }
  ]
}
~~~

## 37. 应用主题

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 theme.apply 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-37",
  "steps": [
    {
      "id": "s1",
      "op": "theme.apply",
      "params": {
        "theme": {
          "schema": "xutu.theme/v1",
          "name": "合成主题",
          "scope": {
            "origin": "https://plan.fpgabbs.cn",
            "path": "/*"
          },
          "tokens": {
            "accent": "#246b50"
          },
          "selectors": {
            "body": {
              "fontSize": "15px"
            }
          }
        }
      }
    }
  ]
}
~~~

## 38. 导出主题

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 theme.export 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-38",
  "steps": [
    {
      "id": "s1",
      "op": "theme.export",
      "params": {}
    }
  ]
}
~~~

## 39. 恢复默认外观

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 theme.reset 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-39",
  "steps": [
    {
      "id": "s1",
      "op": "theme.reset",
      "params": {}
    }
  ]
}
~~~

## 40. 隐藏宣传区

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 layout.hide 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-40",
  "steps": [
    {
      "id": "s1",
      "op": "layout.hide",
      "params": {
        "selector": ".intro"
      }
    }
  ]
}
~~~

## 41. 恢复宣传区

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 layout.show 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-41",
  "steps": [
    {
      "id": "s1",
      "op": "layout.show",
      "params": {
        "selector": ".intro"
      }
    }
  ]
}
~~~

## 42. 插入文本组件

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 layout.component.add 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-42",
  "steps": [
    {
      "id": "s1",
      "op": "layout.component.add",
      "params": {
        "component": {
          "id": "test-note",
          "kind": "note",
          "anchor": ".workspace",
          "text": "本地合成提示"
        }
      }
    }
  ]
}
~~~

## 43. 删除组件

适用条件：需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

预期：调用 layout.component.remove 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-43",
  "steps": [
    {
      "id": "s1",
      "op": "layout.component.remove",
      "params": {
        "id": "test-note"
      }
    }
  ]
}
~~~

## 44. 读取网页标题 JS

适用条件：需开启 User Scripts；代码仅读取当前页标题

预期：调用 script.execute 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-44",
  "steps": [
    {
      "id": "s1",
      "op": "script.execute",
      "params": {
        "world": "USER_SCRIPT",
        "source": "document.title"
      }
    }
  ]
}
~~~

## 45. 查询已有执行结果

适用条件：只读本机去重日志，不返回原始命令

预期：调用 system.logs 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-45",
  "steps": [
    {
      "id": "s1",
      "op": "system.logs",
      "params": {
        "requestId": "recipe-01"
      }
    }
  ]
}
~~~

## 46. 检查编号、长任务和冗余依赖

适用条件：写操作只用于已授权的测试对象；建议先预览。

预期：调用 graph.inspect 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-46",
  "mode": "execute",
  "steps": [
    {
      "id": "s1",
      "op": "graph.inspect",
      "params": {},
      "target": {
        "id": "TEST_PLAN_ID"
      }
    }
  ]
}
~~~

## 47. 预览零耗时虚边简化

适用条件：写操作只用于已授权的测试对象；建议先预览。

预期：调用 graph.simplify 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-47",
  "mode": "preview",
  "steps": [
    {
      "id": "s1",
      "op": "graph.simplify",
      "params": {},
      "target": {
        "id": "TEST_PLAN_ID"
      }
    }
  ]
}
~~~

## 48. 执行零耗时虚边简化

适用条件：写操作只用于已授权的测试对象；建议先预览。

预期：调用 graph.simplify 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-48",
  "mode": "execute",
  "steps": [
    {
      "id": "s1",
      "op": "graph.simplify",
      "params": {},
      "target": {
        "id": "TEST_PLAN_ID"
      }
    }
  ]
}
~~~

## 49. 撤销最近外观修改

适用条件：写操作只用于已授权的测试对象；建议先预览。

预期：调用 theme.undo 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-49",
  "mode": "execute",
  "steps": [
    {
      "id": "s1",
      "op": "theme.undo",
      "params": {}
    }
  ]
}
~~~

## 50. 合并无分支任务链

适用条件及风险：仅草稿、无基线、未完成的无分支链；保留计划编号和首尾节点ID，删除中间节点。不同负责人需显式指定，独立里程碑默认拒绝。 默认预览；核对目标后将mode改为execute执行。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-50",
  "mode": "preview",
  "steps": [
    {
      "id": "s1",
      "op": "task.merge",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "nodeIds": [
          "1",
          "2",
          "3"
        ],
        "name": "合并后的成果"
      }
    }
  ]
}
~~~

## 51. 拆分任务并保留总估时

适用条件及风险：目标原三点估时必须为3、5、7；新增节点2不能已存在。边端点保持，估时总和默认不变。 默认预览；核对目标后将mode改为execute执行。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-51",
  "mode": "preview",
  "steps": [
    {
      "id": "s1",
      "op": "task.split",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "3",
        "nodes": [
          {
            "id": "2",
            "name": "新增中间成果"
          }
        ],
        "segments": [
          {
            "estimateDays": {
              "minimum": 1,
              "likely": 2,
              "maximum": 3
            }
          },
          {
            "estimateDays": {
              "minimum": 2,
              "likely": 3,
              "maximum": 4
            }
          }
        ]
      }
    }
  ]
}
~~~

## 52. 工作任务表更新完成日期

适用条件及风险：任务必须在网站工作任务表中，服务器canComplete为true；可能要求先审核。写入完成日期会影响进度。 默认预览；核对目标后将mode改为execute执行。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-52",
  "mode": "preview",
  "steps": [
    {
      "id": "s1",
      "op": "task.updateStatus",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "2",
        "actualCompleteDate": "2026-11-10"
      }
    }
  ]
}
~~~

## 53. 工作任务表分配执行人

适用条件及风险：替换为真实人员目录名称；服务器canAssign必须为true。不会新建账号。 默认预览；核对目标后将mode改为execute执行。

~~~json
{
  "protocol": "xutu.command/v1",
  "requestId": "recipe-53",
  "mode": "preview",
  "steps": [
    {
      "id": "s1",
      "op": "task.assign",
      "target": {
        "id": "TEST_PLAN_ID"
      },
      "params": {
        "fromNodeId": "1",
        "toNodeId": "2",
        "executor": "TEST_ASSIGNEE"
      }
    }
  ]
}
~~~
