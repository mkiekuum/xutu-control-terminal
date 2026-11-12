# v3.0.2 正式参数契约

JSON 使用 xutu.command/v1；插件主界面不接受 CLI 或独立 JavaScript。script.execute 仅通过显式 JSON 及原浏览器权限使用。

plan.get/plan.export 成功回读提供 targetId、afterVersion，后续同目标可用 versionFrom 引用。不能引用别的计划、失败步骤或格式校验结果。plan.batch 保留一次受版本保护提交；多计划不构成事务。

history.preview 为只读，direction=undo/redo/point（point 需要 historyId/point），返回实际字段差异、冲突、不可恢复原因及 reviewToken。history.undo/redo/restorePoint 接受可选 reviewToken，同字段冲突必须匹配最新预览才能处理；UI 中恢复总先显示差异。history.pending 只读关联原请求记录、最新计划与快照差异；history.resolvePending 需要 acknowledge:true 和最新 reviewToken，仅保留现状、关闭缺口，受影响历史仍不可恢复。

verifySaved 将业务与布局分开：verification.businessVerified/layoutVerified。布局非本次明确意图时差异给警告；编号映射、全量替换、快照恢复等布局意图仍严格核验。快照与请求日志仅留本机。

plan.create / plan.batch 新增可选 flowCheck，参见 FLOW_COMPATIBILITY.md。清单只在插件使用，不传网站；按完整候选图比较名称、正文、直接依赖与工作映射。带检查的写入不能省略完整工作映射；preview 可返回未通过报告而不提交。没有清单的旧指令兼容，但标明未核实图纸。主界面尊重 mode=preview/validate，只读不会变为执行。

以下由实际 parameterSchemas 生成；不代表每项均已通过生产网站写入测试。convert 命令沿用既有后端转换器，不新增 draw.io 命令。


site.context.params.projectGroups 可选 all/selected/omit；默认 all，旧指令保持兼容。复制提示词按需求选择范围。提示词的 plan.batch 子参数使用指向同一命令定义对象的 $ref，以下执行契约仍完整展开。

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
    },
    "flowCheck": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "minItems": 1,
          "maxItems": 100,
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
              "kind": {
                "enum": [
                  "outcome",
                  "category",
                  "event",
                  "auxiliary"
                ]
              }
            },
            "required": [
              "id",
              "name",
              "kind"
            ],
            "additionalProperties": false
          }
        },
        "dependencies": {
          "type": "array",
          "maxItems": 300,
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
        "works": {
          "type": "array",
          "maxItems": 300,
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "minLength": 1
              },
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
              }
            },
            "required": [
              "id",
              "fromNodeId",
              "toNodeId",
              "estimateDays"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes",
        "dependencies"
      ],
      "additionalProperties": false,
      "description": "用户确认的目标图纸清单（已包含本次明确同意的修改），不上传网站；默认逐字、逐编号及逐直接箭头比较，未列出的辅助节点也会被拒绝。kind区分完成成果、原分类、事件和明确同意的辅助点。works是完整的一对一确认工作/连线/估时映射，不是允许AI自行拆分工期。缺少映射不能认证开工依赖或工期。"
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
  "additionalProperties": false,
  "description": "仅支持按顺序列出的至少三个连续链节点；保留首尾、删除中间节点。中间节点必须各一入一出且无分支，首尾不能已有直接边；已有基线或链上完成进度不能直接合并。分支合并须明确映射、估时与外部依赖后使用 plan.batch，不可强行串联。"
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
  "properties": {
    "projectGroups": {
      "enum": [
        "all",
        "selected",
        "omit"
      ]
    }
  },
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

## history.undo

```json
{
  "type": "object",
  "properties": {
    "reviewToken": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

## history.redo

```json
{
  "type": "object",
  "properties": {
    "reviewToken": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

## history.pending

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

## history.preview

```json
{
  "type": "object",
  "properties": {
    "direction": {
      "enum": [
        "undo",
        "redo",
        "point"
      ]
    },
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
    "direction"
  ],
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
    },
    "reviewToken": {
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

## history.resolvePending

```json
{
  "type": "object",
  "properties": {
    "acknowledge": {
      "const": true
    },
    "reviewToken": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "acknowledge",
    "reviewToken"
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

## plan.batch

```json
{
  "type": "object",
  "properties": {
    "flowCheck": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "minItems": 1,
          "maxItems": 100,
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
              "kind": {
                "enum": [
                  "outcome",
                  "category",
                  "event",
                  "auxiliary"
                ]
              }
            },
            "required": [
              "id",
              "name",
              "kind"
            ],
            "additionalProperties": false
          }
        },
        "dependencies": {
          "type": "array",
          "maxItems": 300,
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
        "works": {
          "type": "array",
          "maxItems": 300,
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "minLength": 1
              },
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
              }
            },
            "required": [
              "id",
              "fromNodeId",
              "toNodeId",
              "estimateDays"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes",
        "dependencies"
      ],
      "additionalProperties": false,
      "description": "用户确认的目标图纸清单（已包含本次明确同意的修改），不上传网站；默认逐字、逐编号及逐直接箭头比较，未列出的辅助节点也会被拒绝。kind区分完成成果、原分类、事件和明确同意的辅助点。works是完整的一对一确认工作/连线/估时映射，不是允许AI自行拆分工期。缺少映射不能认证开工依赖或工期。"
    },
    "changes": {
      "type": "array",
      "minItems": 1,
      "maxItems": 100,
      "items": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "plan.update"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "schedule.updateInputs"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "node.create"
              },
              "params": {
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
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "node.update"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "node.batchUpdate"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "node.renumber"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "node.remove"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "node.reorder"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "edge.create"
              },
              "params": {
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
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "edge.update"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "edge.remove"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "graph.simplify"
              },
              "params": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": false
              }
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "task.merge"
              },
              "params": {
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
                "additionalProperties": false,
                "description": "仅支持按顺序列出的至少三个连续链节点；保留首尾、删除中间节点。中间节点必须各一入一出且无分支，首尾不能已有直接边；已有基线或链上完成进度不能直接合并。分支合并须明确映射、估时与外部依赖后使用 plan.batch，不可强行串联。"
              }
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "const": "task.split"
              },
              "params": {
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
            },
            "required": [
              "op",
              "params"
            ],
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "required": [
    "changes"
  ],
  "additionalProperties": false
}
```
