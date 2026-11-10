# 命令参考

真实验收见LIVE_TEST_RESULTS.md，限制见ACCEPTANCE.md。默认target.id或唯一number定位，不猜测。写入需当前会话权限。协议结果包含status、steps、code及serverVerified。参数契约同时提供schemas/operation.schema.json。

|操作|通道|权限|验证|
|---|---|---|---|
|plan.list|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|project.list|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|group.list|api|admin|local tests/frontend contract; live write not verified|
|task.list|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|site.session|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|user.list|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|plan.create|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|plan.update|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|plan.replace|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|plan.copy|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|plan.archive|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|plan.delete|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|plan.restore|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|node.create|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|node.update|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|node.remove|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|node.reorder|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|edge.create|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|edge.update|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|edge.remove|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|schedule.updateInputs|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|progress.update|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|progress.complete|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|review.submit|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|review.approve|api|admin|ordinary-user rejection verified; admin positive not tested|
|review.reject|api|admin|local tests/frontend contract; live write not verified|
|history.restore|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|project.create|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|project.assignPlan|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|group.create|api|admin|local tests/frontend contract; live write not verified|
|group.update|api|admin|local tests/frontend contract; live write not verified|
|group.remove|api|admin|local tests/frontend contract; live write not verified|
|group.assign|api|admin|local tests/frontend contract; live write not verified|
|system.version|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|system.capabilities|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.inspect|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.get|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|convert.legacyToNative|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|node.list|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|edge.list|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|progress.read|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|plan.export|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|review.status|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|theme.apply|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|theme.export|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|theme.reset|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.hide|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.show|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.component.add|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.component.remove|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|script.execute|userScripts|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|system.logs|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.delete(permanent)|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|history.list|unavailable|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|history.diff|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|schedule.read|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|schedule.recalculate|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|task.get|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|task.updateStatus|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|
|user.get|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.create|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.update|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.disable|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.list|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.grant|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.revoke|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.assign|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|project.update|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|project.remove|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.click|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.field.set|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.navigation|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|graph.inspect|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|graph.simplify|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|plan.restoreSnapshot|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|theme.undo|dom|current-session/server-authoritative|browser pending|
|task.merge|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|task.split|api|current-session/server-authoritative|authenticated dedicated-record E2E passed|
|task.assign|api|current-session/server-authoritative|local tests/frontend contract; live write not verified|

## 已严格映射的参数

以下参数使用JSON Schema；required列出必填字段，额外字段会拒绝。业务前置条件见终端手册。

### plan.create

~~~json
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
~~~

### plan.update

~~~json
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
~~~

### plan.replace

~~~json
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
~~~

### plan.copy

~~~json
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
~~~

### plan.delete

~~~json
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
~~~

### plan.restoreSnapshot

~~~json
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
~~~

### node.create

~~~json
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
~~~

### node.update

~~~json
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
~~~

### node.remove

~~~json
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
~~~

### node.reorder

~~~json
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
~~~

### edge.create

~~~json
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
~~~

### edge.update

~~~json
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
~~~

### edge.remove

~~~json
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
~~~

### task.merge

~~~json
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
~~~

### task.split

~~~json
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
~~~

### task.assign

~~~json
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
~~~

### task.updateStatus

~~~json
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
~~~

### progress.update

~~~json
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
~~~

### review.reject

~~~json
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
~~~

### history.restore

~~~json
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
~~~

### project.create

~~~json
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
~~~

### project.assignPlan

~~~json
{
  "type": "object",
  "properties": {
    "planId": {
      "type": "string",
      "minLength": 1
    },
    "groupId": {
      "type": "string"
    }
  },
  "required": [
    "planId",
    "groupId"
  ],
  "additionalProperties": false
}
~~~

### group.create

~~~json
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
~~~

### group.update

~~~json
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
~~~

### group.remove

~~~json
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
~~~

### group.assign

~~~json
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
~~~

### script.execute

~~~json
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
~~~

### system.logs

~~~json
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
~~~

### system.status

~~~json
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
~~~

### system.backup.get

~~~json
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
~~~

### schedule.updateInputs

~~~json
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
~~~

### progress.complete

~~~json
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
~~~

### graph.inspect

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### graph.simplify

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### plan.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### plan.get

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### plan.export

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### plan.archive

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### plan.restore

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### node.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### edge.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### progress.read

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### review.status

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### review.submit

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### review.approve

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### history.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### project.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### group.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### task.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### user.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### site.session

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### system.version

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### system.health

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### system.capabilities

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### site.inspect

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### site.capabilities

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### theme.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### theme.export

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### theme.reset

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

### theme.undo

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## 执行约定

validate不写入、不证明账号权限；preview读取前后差异但不写入。execute默认直接执行。requestId在本机扩展存储中去重；服务端操作ID由requestId/步骤确定性转换为UUID。计划修改携带baseRevision并GET回读，不把页面同步文本当成保存证据。外观serverVerified=false，因为只写本机。

常见错误：INVALID_SCHEMA参数错误；INVALID_SITE_DATA服务端400校验拒绝；NOT_LOGGED_IN未登录；PERMISSION_DENIED无权；VERSION_CONFLICT版本变化；SERVER_NOT_CONFIRMED写入后回读不符（可能已经写入）；NETWORK_ERROR状态可能未知；UNSUPPORTED_BY_SITE未核实或不可用；USER_SCRIPTS_DISABLED浏览器未授权；NON_IDEMPOTENT_RETRY_BLOCKED中断后禁止盲目重放。
