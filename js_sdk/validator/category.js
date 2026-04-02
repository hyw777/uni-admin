// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "name": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "分类名称",
    "label": "分类名称"
  },
  "icon": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "分类图标",
    "label": "分类图标"
  },
  "level": {
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
            "text": "一级分类"
          },
          {
            "value": 2,
            "text": "二级分类"
          }
        ]
      }
    ],
    "title": "分类级别",
    "label": "分类级别"
  },
  "parentId": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "父级分类ID",
    "label": "父级分类ID"
  },
  "filterType": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 1,
            "text": "风格"
          },
          {
            "value": 2,
            "text": "尺寸"
          },
          {
            "value": 3,
            "text": "材质"
          },
          {
            "value": 4,
            "text": "其他"
          }
        ]
      }
    ],
    "title": "筛选类型",
    "label": "筛选类型"
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
  },
  "specialOnly": {
    "rules": [
      {
        "format": "boolean"
      }
    ],
    "title": "特殊价格",
    "label": "特殊价格"
  }
}

const enumConverter = {
  "level_valuetotext": {
    "1": "一级分类",
    "2": "二级分类"
  },
  "filterType_valuetotext": {
    "1": "风格",
    "2": "尺寸",
    "3": "材质",
    "4": "其他"
  },
  "status_valuetotext": {
    "0": "禁用",
    "1": "启用"
  },
  "specialOnly_valuetotext": {
    "true": "是",
    "false": "否"
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
