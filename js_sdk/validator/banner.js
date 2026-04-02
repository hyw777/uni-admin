// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "imageUrl": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "轮播图",
    "label": "轮播图"
  },
  "title": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "标题",
    "label": "标题"
  },
  "linkType": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 1,
            "text": "商品详情"
          },
          {
            "value": 2,
            "text": "活动页面"
          },
          {
            "value": 3,
            "text": "分类页面"
          },
          {
            "value": 4,
            "text": "外部链接"
          }
        ]
      }
    ],
    "title": "跳转类型",
    "defaultValue": 1,
    "label": "跳转类型"
  },
  "linkValue": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "跳转值",
    "label": "跳转值"
  },
  "sort": {
    "rules": [
      {
        "required": true
      },
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
  "linkType_valuetotext": {
    "1": "商品详情",
    "2": "活动页面",
    "3": "分类页面",
    "4": "外部链接"
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
