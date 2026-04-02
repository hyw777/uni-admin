// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "title": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "活动标题",
    "label": "活动标题"
  },
  "type": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 1,
            "text": "限时折扣"
          },
          {
            "value": 2,
            "text": "满减活动"
          },
          {
            "value": 3,
            "text": "优惠券"
          }
        ]
      }
    ],
    "title": "活动类型",
    "label": "活动类型"
  },
  "image": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "活动图片",
    "label": "活动图片"
  },
  "description": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "活动描述",
    "label": "活动描述"
  },
  "discount": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "折扣",
    "label": "折扣"
  },
  "fullAmount": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "满减金额",
    "label": "满减金额"
  },
  "reduceAmount": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "减多少",
    "label": "减多少"
  },
  "couponValue": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "优惠券金额",
    "label": "优惠券金额"
  },
  "couponMinAmount": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "最低使用金额",
    "label": "最低使用金额"
  },
  "startTime": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "timestamp"
      }
    ],
    "title": "开始时间",
    "label": "开始时间"
  },
  "endTime": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "timestamp"
      }
    ],
    "title": "结束时间",
    "label": "结束时间"
  },
  "sort": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "title": "排序",
    "defaultValue": 0,
    "label": "排序"
  },
  "status": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 0,
            "text": "禁用"
          },
          {
            "value": 1,
            "text": "启用"
          }
        ]
      }
    ],
    "title": "状态",
    "defaultValue": 1,
    "label": "状态"
  }
}

const enumConverter = {
  "type_valuetotext": {
    "1": "限时折扣",
    "2": "满减活动",
    "3": "优惠券"
  },
  "status_valuetotext": {
    "0": "禁用",
    "1": "启用"
  }
}

function filterToWhere(filter, command) {
  let where = {}
  for (let field in filter) {
    let { type, value } = filter[field]
    switch (type) {
      case "search":
        if (typeof value === 'string' && value.length) {
          where[field] = new RegExp(value)
        }
        break;
      case "select":
        if (value.length) {
          let selectValue = []
          for (let s of value) {
            selectValue.push(command.eq(s))
          }
          where[field] = command.or(selectValue)
        }
        break;
      case "range":
        if (value.length) {
          let gt = value[0]
          let lt = value[1]
          where[field] = command.and([command.gte(gt), command.lte(lt)])
        }
        break;
      case "date":
        if (value.length) {
          let [s, e] = value
          let startDate = new Date(s)
          let endDate = new Date(e)
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
      case "timestamp":
        if (value.length) {
          let [startDate, endDate] = value
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
    }
  }
  return where
}

export { validator, enumConverter, filterToWhere }
