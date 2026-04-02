// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "order_type": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "items": {
    "rules": [
      {
        "format": "array"
      }
    ]
  },
  "total_fee": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      }
    ]
  },
  "status": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      }
    ],
    "defaultValue": 0
  },
  "store_id": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "redemption_store_name": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "redemption_store_address": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "redemption_store_mobile": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "delivery_method": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "title": "配送方式",
    "label": "配送方式"
  },
  "logistics_company": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "物流公司",
    "label": "物流公司"
  },
  "logistics_no": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "物流单号",
    "label": "物流单号"
  },
  "installation_status": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "title": "安装状态",
    "label": "安装状态"
  },
  "address": {
    "rules": [
      {
        "format": "object"
      }
    ]
  },
  "user_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "create_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  }
}

const enumConverter = {
  order_type_localdata: [
    { value: 'normal', text: '普通商品' },
    { value: 'group_online', text: '线上团购' },
    { value: 'group_offline', text: '线下体验/代金券' }
  ],
  status_localdata: [
    { value: 0, text: '待支付' },
    { value: 1, text: '待发货' },
    { value: 2, text: '已发货' },
    { value: 3, text: '已完成' },
    { value: -1, text: '已取消' }
  ],
  delivery_method_localdata: [
    { value: 1, text: '快递' },
    { value: 2, text: '大件物流' },
    { value: 3, text: '送货入户带安装' },
    { value: 4, text: '同城车队' }
  ],
  installation_status_localdata: [
    { value: 0, text: '无需安装' },
    { value: 1, text: '待分配' },
    { value: 2, text: '待安装' },
    { value: 3, text: '已安装' }
  ]
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
