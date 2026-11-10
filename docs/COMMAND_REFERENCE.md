# 命令参考

本版仅终端。参数与权限边界见CURRENT_STATUS.md。普通界面一键执行；CLI/API可自行使用preview/validate。site.context可指定target.id/number，否则读取所选网页当前计划；site.tabs列出可操作网页。

## plan.create

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

## plan.update

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

## plan.replace

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

## plan.copy

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

## plan.delete

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

## plan.restoreSnapshot

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

## node.create

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

## node.update

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

## node.remove

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

## node.reorder

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

## edge.create

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

## edge.update

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

## edge.remove

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

## task.merge

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

## task.split

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

## task.assign

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

## task.updateStatus

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

## progress.update

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

## review.reject

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

## history.restore

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

## project.create

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

## project.assignPlan

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

## group.create

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

## group.update

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

## group.remove

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

## group.assign

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

## script.execute

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

## system.logs

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

## system.status

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

## system.backup.get

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

## schedule.updateInputs

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

## progress.complete

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

## graph.inspect

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## graph.simplify

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## plan.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## plan.get

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## plan.export

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## plan.archive

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## plan.restore

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## node.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## edge.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## progress.read

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## review.status

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## review.submit

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## review.approve

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## history.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## project.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## group.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## task.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## user.list

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## site.session

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## system.version

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## system.health

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## system.capabilities

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## site.inspect

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## site.capabilities

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## site.context

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~

## site.tabs

~~~json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
~~~
