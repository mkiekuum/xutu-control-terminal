> v2.5.1 更新：所有澄清、表达偏好、分工与估时确认均在外部 AI 对话中完成。插件不再提供本地问卷、偏好设置、intakeId 门禁或方案确认按钮。以下旧版相关描述已被此决定取代。

# 命令参考 v2.5

插件仅接收 JSON/Markdown JSON。信封 protocol=xutu.command/v1、requestId、steps，按需 mode/tabId/intakeId。普通执行器保留参数、权限、版本、去重、独立失败回读。复杂写入使用本地问卷；script.execute 不得绕过正式契约。CLI 已删除。

扩展本地接口：intake.*、history.list/diff/undo/redo/restorePoint/resolvePending、site.html.*；不冒称网站有这些 API。网页导出必须是独立请求，不进日志或历史。intake 确认提案仅在 UI 操作，不开放 AI 自行批准命令。

project.assignPlan 可填写 planId，或 planIdFrom={stepId,field:"targetId"} 并依赖已回读成功的 plan.create，两者互斥。创建与分组可能部分成功。history.restore 仍是旧的服务器版本恢复，与扩展 restorePoint 不同。

[问卷](V2.5_INTAKE_MANUAL.md)、[字段](V2.5_PLAN_FIELDS.md)、[历史](V2.5_UNDO_HISTORY.md)、[导出](V2.5_HTML_EXPORT.md)、[局部修改](LOCAL_EDITING.md) 解释执行条件。以下参数契约由 validation.js 生成；服务器仍最终决定权限。

## plan.create

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1
    },
    "number": {
      "type": "string",
      "minLength": 1
    },
    "owner": {
      "type": "string",
      "minLength": 1
    },
    "startDate": {
      "type": "string"
    },
    "deadlineDate": {
      "type": "string"
    },
    "status": {
      "const": "draft"
    },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "name": {
            "type": "string",
            "minLength": 1
          },
          "content": {
            "type": "string"
          },
          "ownerName": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "fromNodeId": {
            "type": "string",
            "minLength": 1
          },
          "toNodeId": {
            "type": "string",
            "minLength": 1
          },
          "estimateDays": {
            "type": "object",
            "properties": {
              "minimum": {
                "type": "number",
                "minimum": 0
              },
              "likely": {
                "type": "number",
                "minimum": 0
              },
              "maximum": {
                "type": "number",
                "minimum": 0
              }
            },
            "required": [
              "minimum",
              "likely",
              "maximum"
            ],
            "additionalProperties": false
          },
          "dashed": {
            "type": "boolean"
          },
          "executor": {
            "type": "string"
          },
          "actualCompleteDate": {
            "type": "string"
          }
        },
        "required": [
          "fromNodeId",
          "toNodeId",
          "estimateDays"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "title",
    "number"
  ],
  "additionalProperties": false
}
```

## plan.update

```json
{
  "type": "object",
  "properties": {
    "set": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "minLength": 1
        },
        "startDate": {
          "type": "string"
        },
        "deadlineDate": {
          "type": "string"
        }
      },
      "required": [],
      "additionalProperties": false
    }
  },
  "required": [
    "set"
  ],
  "additionalProperties": false
}
```

## plan.replace

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1
    },
    "number": {
      "type": "string",
      "minLength": 1
    },
    "owner": {
      "type": "string",
      "minLength": 1
    },
    "startDate": {
      "type": "string"
    },
    "deadlineDate": {
      "type": "string"
    },
    "status": {
      "const": "draft"
    },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "name": {
            "type": "string",
            "minLength": 1
          },
          "content": {
            "type": "string"
          },
          "ownerName": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "fromNodeId": {
            "type": "string",
            "minLength": 1
          },
          "toNodeId": {
            "type": "string",
            "minLength": 1
          },
          "estimateDays": {
            "type": "object",
            "properties": {
              "minimum": {
                "type": "number",
                "minimum": 0
              },
              "likely": {
                "type": "number",
                "minimum": 0
              },
              "maximum": {
                "type": "number",
                "minimum": 0
              }
            },
            "required": [
              "minimum",
              "likely",
              "maximum"
            ],
            "additionalProperties": false
          },
          "dashed": {
            "type": "boolean"
          },
          "executor": {
            "type": "string"
          },
          "actualCompleteDate": {
            "type": "string"
          }
        },
        "required": [
          "fromNodeId",
          "toNodeId",
          "estimateDays"
        ],
        "additionalProperties": false
      }
    },
    "replace": {
      "const": true
    }
  },
  "required": [
    "title",
    "nodes",
    "edges",
    "replace"
  ],
  "additionalProperties": false
}
```

## plan.copy

```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "minLength": 1
    },
    "owner": {
      "type": "string",
      "minLength": 1
    },
    "title": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "number"
  ],
  "additionalProperties": false
}
```

## plan.delete

```json
{
  "type": "object",
  "properties": {
    "permanent": {
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

## plan.restoreSnapshot

```json
{
  "type": "object",
  "properties": {
    "backupId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "backupId"
  ],
  "additionalProperties": false
}
```

## node.create

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "content": {
      "type": "string"
    },
    "ownerName": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false
}
```

## node.update

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "set": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "content": {
          "type": "string"
        },
        "owner": {
          "type": "string"
        }
      },
      "required": [],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "set"
  ],
  "additionalProperties": false
}
```

## node.remove

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

## node.batchUpdate

```json
{
  "type": "object",
  "properties": {
    "updates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "set": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "minLength": 1
              },
              "content": {
                "type": "string"
              },
              "owner": {
                "type": "string"
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "id",
          "set"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "updates"
  ],
  "additionalProperties": false
}
```

## node.renumber

```json
{
  "type": "object",
  "properties": {
    "mapping": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "minLength": 1
          },
          "to": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "from",
          "to"
        ],
        "additionalProperties": false
      }
    },
    "references": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "nodeId": {
            "type": "string",
            "minLength": 1
          },
          "field": {
            "enum": [
              "name",
              "content"
            ]
          },
          "before": {
            "type": "string"
          },
          "after": {
            "type": "string"
          }
        },
        "required": [
          "nodeId",
          "field",
          "before",
          "after"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "mapping"
  ],
  "additionalProperties": false
}
```

## node.reorder

```json
{
  "type": "object",
  "properties": {
    "ids": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "uniqueItems": true
    }
  },
  "required": [
    "ids"
  ],
  "additionalProperties": false
}
```

## edge.create

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    },
    "estimateDays": {
      "type": "object",
      "properties": {
        "minimum": {
          "type": "number",
          "minimum": 0
        },
        "likely": {
          "type": "number",
          "minimum": 0
        },
        "maximum": {
          "type": "number",
          "minimum": 0
        }
      },
      "required": [
        "minimum",
        "likely",
        "maximum"
      ],
      "additionalProperties": false
    },
    "dashed": {
      "type": "boolean"
    },
    "executor": {
      "type": "string"
    },
    "actualCompleteDate": {
      "type": "string"
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId",
    "estimateDays"
  ],
  "additionalProperties": false
}
```

## edge.update

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    },
    "estimateDays": {
      "type": "object",
      "properties": {
        "minimum": {
          "type": "number",
          "minimum": 0
        },
        "likely": {
          "type": "number",
          "minimum": 0
        },
        "maximum": {
          "type": "number",
          "minimum": 0
        }
      },
      "required": [
        "minimum",
        "likely",
        "maximum"
      ],
      "additionalProperties": false
    },
    "dashed": {
      "type": "boolean"
    },
    "executor": {
      "type": "string"
    },
    "actualCompleteDate": {
      "type": "string"
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId"
  ],
  "additionalProperties": false
}
```

## edge.remove

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId"
  ],
  "additionalProperties": false
}
```

## task.merge

```json
{
  "type": "object",
  "properties": {
    "nodeIds": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "uniqueItems": true
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "content": {
      "type": "string"
    },
    "owner": {
      "type": "string"
    },
    "executor": {
      "type": "string"
    },
    "allowMilestones": {
      "type": "boolean"
    }
  },
  "required": [
    "nodeIds",
    "name"
  ],
  "additionalProperties": false
}
```

## task.split

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "name": {
            "type": "string",
            "minLength": 1
          },
          "content": {
            "type": "string"
          },
          "ownerName": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "segments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "estimateDays": {
            "type": "object",
            "properties": {
              "minimum": {
                "type": "number",
                "minimum": 0
              },
              "likely": {
                "type": "number",
                "minimum": 0
              },
              "maximum": {
                "type": "number",
                "minimum": 0
              }
            },
            "required": [
              "minimum",
              "likely",
              "maximum"
            ],
            "additionalProperties": false
          },
          "executor": {
            "type": "string"
          },
          "dashed": {
            "type": "boolean"
          }
        },
        "required": [
          "estimateDays"
        ],
        "additionalProperties": false
      }
    },
    "allowDurationChange": {
      "type": "boolean"
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId",
    "nodes",
    "segments"
  ],
  "additionalProperties": false
}
```

## task.assign

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    },
    "executor": {
      "type": "string"
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId",
    "executor"
  ],
  "additionalProperties": false
}
```

## task.updateStatus

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    },
    "actualCompleteDate": {
      "type": "string"
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId",
    "actualCompleteDate"
  ],
  "additionalProperties": false
}
```

## progress.update

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    },
    "actualCompleteDate": {
      "type": "string"
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId",
    "actualCompleteDate"
  ],
  "additionalProperties": false
}
```

## review.reject

```json
{
  "type": "object",
  "properties": {
    "note": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "note"
  ],
  "additionalProperties": false
}
```

## history.restore

```json
{
  "type": "object",
  "properties": {
    "targetRevision": {
      "type": "integer",
      "minimum": 1
    }
  },
  "required": [
    "targetRevision"
  ],
  "additionalProperties": false
}
```

## project.create

```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "owner": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "number",
    "name",
    "owner"
  ],
  "additionalProperties": false
}
```

## project.assignPlan

```json
{
  "type": "object",
  "properties": {
    "planId": {
      "type": "string",
      "minLength": 1
    },
    "planIdFrom": {
      "type": "object",
      "properties": {
        "stepId": {
          "type": "string",
          "minLength": 1
        },
        "field": {
          "const": "targetId"
        }
      },
      "required": [
        "stepId",
        "field"
      ],
      "additionalProperties": false
    },
    "groupId": {
      "type": "string"
    }
  },
  "required": [
    "groupId"
  ],
  "additionalProperties": false,
  "oneOf": [
    {
      "required": [
        "planId"
      ],
      "not": {
        "required": [
          "planIdFrom"
        ]
      }
    },
    {
      "required": [
        "planIdFrom"
      ],
      "not": {
        "required": [
          "planId"
        ]
      }
    }
  ]
}
```

## group.create

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
```

## group.update

```json
{
  "type": "object",
  "properties": {
    "groupId": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "groupId",
    "name"
  ],
  "additionalProperties": false
}
```

## group.remove

```json
{
  "type": "object",
  "properties": {
    "groupId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "groupId"
  ],
  "additionalProperties": false
}
```

## group.assign

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "groupId": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "groupId"
  ],
  "additionalProperties": false
}
```

## script.execute

```json
{
  "type": "object",
  "properties": {
    "source": {
      "type": "string",
      "minLength": 1
    },
    "world": {
      "enum": [
        "MAIN",
        "USER_SCRIPT"
      ]
    }
  },
  "required": [
    "source",
    "world"
  ],
  "additionalProperties": false
}
```

## system.logs

```json
{
  "type": "object",
  "properties": {
    "requestId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "requestId"
  ],
  "additionalProperties": false
}
```

## system.status

```json
{
  "type": "object",
  "properties": {
    "requestId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "requestId"
  ],
  "additionalProperties": false
}
```

## system.backup.get

```json
{
  "type": "object",
  "properties": {
    "backupId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "backupId"
  ],
  "additionalProperties": false
}
```

## schedule.updateInputs

```json
{
  "type": "object",
  "properties": {
    "set": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "minLength": 1
        },
        "startDate": {
          "type": "string"
        },
        "deadlineDate": {
          "type": "string"
        }
      },
      "required": [],
      "additionalProperties": false
    }
  },
  "required": [
    "set"
  ],
  "additionalProperties": false
}
```

## progress.complete

```json
{
  "type": "object",
  "properties": {
    "fromNodeId": {
      "type": "string",
      "minLength": 1
    },
    "toNodeId": {
      "type": "string",
      "minLength": 1
    },
    "actualCompleteDate": {
      "type": "string"
    }
  },
  "required": [
    "fromNodeId",
    "toNodeId",
    "actualCompleteDate"
  ],
  "additionalProperties": false
}
```

## graph.inspect

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## graph.simplify

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## plan.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## plan.get

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## plan.export

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## plan.archive

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## plan.restore

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## node.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## edge.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## progress.read

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## review.status

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## review.submit

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## review.approve

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## history.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## project.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## group.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## task.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## user.list

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## site.session

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## system.version

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## system.health

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## system.capabilities

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## site.inspect

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## site.capabilities

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## site.context

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## site.tabs

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## site.compatibility

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## intake.inspect

```json
{
  "type": "object",
  "properties": {
    "request": {
      "type": "string",
      "minLength": 1
    },
    "intent": {
      "enum": [
        "create",
        "manage"
      ]
    }
  },
  "required": [
    "request",
    "intent"
  ],
  "additionalProperties": false
}
```

## intake.answer

```json
{
  "type": "object",
  "properties": {
    "intakeId": {
      "type": "string",
      "minLength": 1
    },
    "rememberExpression": {
      "type": "boolean"
    },
    "answers": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "number": {
          "type": "string"
        },
        "startDate": {
          "type": "string"
        },
        "deadlineDate": {
          "type": "string"
        },
        "projectGroupId": {
          "type": "string"
        },
        "goal": {
          "type": "string"
        },
        "resources": {
          "type": "string"
        },
        "expression": {
          "type": "string"
        }
      },
      "required": [],
      "additionalProperties": false
    }
  },
  "required": [
    "intakeId",
    "answers"
  ],
  "additionalProperties": false
}
```

## intake.status

```json
{
  "type": "object",
  "properties": {
    "intakeId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "intakeId"
  ],
  "additionalProperties": false
}
```

## history.undo

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## history.redo

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## history.diff

```json
{
  "type": "object",
  "properties": {
    "historyId": {
      "type": "string",
      "minLength": 1
    },
    "point": {
      "enum": [
        "before",
        "after"
      ]
    },
    "compareId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "historyId"
  ],
  "additionalProperties": false
}
```

## history.restorePoint

```json
{
  "type": "object",
  "properties": {
    "historyId": {
      "type": "string",
      "minLength": 1
    },
    "point": {
      "enum": [
        "before",
        "after"
      ]
    }
  },
  "required": [
    "historyId"
  ],
  "additionalProperties": false
}
```

## history.resolvePending

```json
{
  "type": "object",
  "properties": {
    "acknowledge": {
      "const": true
    }
  },
  "required": [
    "acknowledge"
  ],
  "additionalProperties": false
}
```

## site.html.begin

```json
{
  "type": "object",
  "properties": {
    "kind": {
      "enum": [
        "raw",
        "offline"
      ]
    }
  },
  "required": [
    "kind"
  ],
  "additionalProperties": false
}
```

## site.html.chunk

```json
{
  "type": "object",
  "properties": {
    "exportId": {
      "type": "string",
      "minLength": 1
    },
    "offset": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": [
    "exportId",
    "offset"
  ],
  "additionalProperties": false
}
```

## site.html.release

```json
{
  "type": "object",
  "properties": {
    "exportId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "exportId"
  ],
  "additionalProperties": false
}
```
## v2.5.2 批量编辑与最小修改

单计划结构调整使用 plan.batch，target 给稳定 id 和最新 version，params 为 changes:[{op,params}]。允许计划属性、节点、边、合并拆分和虚线简化的正式白名单；不能嵌套batch、创建/删除整个计划、审核、脚本或跨计划操作。完整参数见 schemas/operation.schema.json。

所有子变换在本地副本验证，通过后一次受版本保护提交并回读，未指定的日期、人员、基线和布局保留。不是服务端多操作事务；超时仍可能是未知结果。旧多步JSON在满足单目标和版本依据条件时由主界面自动合并，结果摘要显示一次提交；不满足条件保持旧行为，不宣称全批原子性。

命令格式校验通过不等于已写入。内容无变化会跳过保存；冲突只读回查，不能猜版本重发。详细限制和验收见 docs/V2.5.2_RELIABILITY.md。
