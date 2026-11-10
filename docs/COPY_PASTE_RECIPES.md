# 指令示例

45份计划与终端示例。TEST_*替换为自己有权限的对象；写操作会修改服务器数据。插件执行按钮直接执行，无需预览确认。以下mode仅供CLI/API调用。

## 1. 查看版本

无需网站登录，只读取扩展版本

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

读取实现范围，不代表当前账号授权

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

转换结果在 data.plan；检查 losses 后再构造 plan.create，不自动写入

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

仅测试管理员、合成计划；改变审核状态

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

仅测试管理员、合成计划；改变审核状态

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需要已登录的序图标签页；写操作仅在隔离测试数据上使用。

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

需服务器实际允许的管理员角色

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

## 37. 读取网页标题 JS

需开启 User Scripts；代码仅读取当前页标题

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

## 38. 查询已有执行结果

只读本机去重日志，不返回原始命令

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

## 39. 检查编号、长任务和冗余依赖

写操作只用于已授权的测试对象；建议先预览。

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

## 40. 预览零耗时虚边简化

写操作只用于已授权的测试对象；建议先预览。

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

## 41. 执行零耗时虚边简化

写操作只用于已授权的测试对象；建议先预览。

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

## 42. 合并无分支任务链

仅草稿、无基线、未完成的无分支链；保留计划编号和首尾节点ID，删除中间节点。不同负责人需显式指定，独立里程碑默认拒绝。

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

## 43. 拆分任务并保留总估时

目标原三点估时必须为3、5、7；新增节点2不能已存在。边端点保持，估时总和默认不变。

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

## 44. 工作任务表更新完成日期

任务必须在网站工作任务表中，服务器canComplete为true；可能要求先审核。写入完成日期会影响进度。

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

## 45. 工作任务表分配执行人

替换为真实人员目录名称；服务器canAssign必须为true。不会新建账号。

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
