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
    "title": "商品名称",
    "label": "商品名称"
  },
  "mainImage": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "商品主图",
    "label": "商品主图"
  },
  "images": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "商品图片",
    "label": "商品图片"
  },
  "price": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "double"
      }
    ],
    "title": "售价",
    "label": "售价"
  },
  "originalPrice": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "原价",
    "label": "原价"
  },
  "specialPrice": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "特殊价格",
    "label": "特殊价格"
  },
  "categoryId": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "分类ID",
    "label": "分类ID"
  },
  "subCategoryIds": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "二级分类ID",
    "label": "二级分类ID"
  },
  "brand": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "品牌",
    "label": "品牌"
  },
  "space_tags": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      },
      {
        "range": [
          {
            "value": "精选",
            "text": "精选"
          },
          {
            "value": "客厅",
            "text": "客厅"
          },
          {
            "value": "餐厅",
            "text": "餐厅"
          },
          {
            "value": "卧室",
            "text": "卧室"
          },
          {
            "value": "儿童房",
            "text": "儿童房"
          },
          {
            "value": "书房",
            "text": "书房"
          },
          {
            "value": "灯饰",
            "text": "灯饰"
          },
          {
            "value": "卫浴",
            "text": "卫浴"
          }
        ]
      }
    ],
    "title": "适用空间",
    "label": "适用空间"
  },
  "sellingPoints": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "核心卖点",
    "label": "核心卖点"
  },
  "description": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "商品描述",
    "label": "商品描述"
  },
  "isHot": {
    "rules": [
      {
        "format": "bool"
      }
    ],
    "title": "热门商品",
    "defaultValue": false,
    "label": "热门商品"
  },
  "isNew": {
    "rules": [
      {
        "format": "bool"
      }
    ],
    "title": "新品",
    "defaultValue": true,
    "label": "新品"
  },
  "stock": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "title": "库存",
    "defaultValue": 0,
    "label": "库存"
  },
  "sales": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "title": "销量",
    "defaultValue": 0,
    "label": "销量"
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
            "text": "下架"
          },
          {
            "value": 1,
            "text": "上架"
          }
        ]
      }
    ],
    "title": "状态",
    "defaultValue": 1,
    "label": "状态"
  },
  "origin": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "发货地",
    "label": "发货地"
  },
  "rating": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "评分",
    "label": "评分"
  },
  "promotion_tag": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "促销标签",
    "label": "促销标签"
  },
  "promotion_desc": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "促销描述",
    "label": "促销描述"
  },
  "freight_fee": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "运费",
    "label": "运费"
  },
  "install_fee": {
    "rules": [
      {
        "format": "double"
      }
    ],
    "title": "送装费",
    "label": "送装费"
  },
  "service_tags": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "服务保障",
    "label": "服务保障"
  },
  "materials": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "材质简要",
    "label": "材质简要"
  },
  "dimensions": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "尺寸简要",
    "label": "尺寸简要"
  },
  "specs": {
    "rules": [
      {
        "format": "array"
      }
    ],
    "title": "规格参数组",
    "label": "规格参数组"
  },
  "pointItems": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "产品卖点介绍列表",
    "label": "产品卖点介绍列表"
  },
  "detailImages": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "商品详情长图说明",
    "label": "商品详情长图说明"
  },
  "serviceImages": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "服务保障长图说明",
    "label": "服务保障长图说明"
  }
}

const enumConverter = {
  "space_tags_valuetotext": [
    {
      "value": "精选",
      "text": "精选"
    },
    {
      "value": "客厅",
      "text": "客厅"
    },
    {
      "value": "餐厅",
      "text": "餐厅"
    },
    {
      "value": "卧室",
      "text": "卧室"
    },
    {
      "value": "儿童房",
      "text": "儿童房"
    },
    {
      "value": "书房",
      "text": "书房"
    },
    {
      "value": "灯饰",
      "text": "灯饰"
    },
    {
      "value": "卫浴",
      "text": "卫浴"
    }
  ],
  "status_valuetotext": {
    "0": "下架",
    "1": "上架"
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
