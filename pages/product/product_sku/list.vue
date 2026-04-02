<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title"></view>
        <view class="uni-sub-title"></view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
        <button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
        <download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
          <button class="uni-button" type="primary" size="mini">导出 Excel</button>
        </download-excel>
      </view>
    </view>
    <view class="uni-container">
      <unicloud-db ref="udb" :collection="collectionList" field="product_id,sku_name,image,price,specialPrice,stock" :where="where" page-data="replace"
        :orderby="orderby" :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent"
        v-slot:default="{data,pagination,loading,error,options}" :options="options" loadtime="manual" @load="onqueryload">
        <uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
          <uni-tr>
            <uni-th align="center" sortable>商品</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'sku_name')" sortable @sort-change="sortChange($event, 'sku_name')">SKU</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'price')" sortable @sort-change="sortChange($event, 'price')">价格</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'specialPrice')" sortable @sort-change="sortChange($event, 'specialPrice')">特殊价格</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'stock')" sortable @sort-change="sortChange($event, 'stock')">库存</uni-th>
            <uni-th align="center">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item,index) in data" :key="index">
            <uni-td align="center">
              <view class="product-cell">
                <image v-if="getProductImage(item.product_id)" :src="getProductImage(item.product_id)" mode="aspectFill" class="product-thumb" />
                <view class="product-meta">
                  <text class="product-name">{{ getProductName(item.product_id) }}</text>
                  <text class="product-id">{{ item.product_id }}</text>
                </view>
              </view>
            </uni-td>
            <uni-td align="center">{{item.sku_name}}</uni-td>
            <uni-td align="center">{{item.price}}</uni-td>
            <uni-td align="center">{{item.specialPrice}}</uni-td>
            <uni-td align="center">{{item.stock}}</uni-td>
            <uni-td align="center">
              <view class="uni-group">
                <button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini" type="primary">修改</button>
                <button @click="confirmDelete(item._id)" class="uni-button" size="mini" type="warn">删除</button>
              </view>
            </uni-td>
          </uni-tr>
        </uni-table>
        <view class="uni-pagination-box">
          <uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
        </view>
      </unicloud-db>
    </view>
  </view>
</template>

<script>
  import { enumConverter, filterToWhere } from '../../../js_sdk/validator/product_sku.js';

  const db = uniCloud.database()
  const dbCmd = db.command
  // 表查询配置
  const dbOrderBy = '' // 排序字段
  const dbSearchFields = [] // 模糊搜索字段，支持模糊搜索的字段列表。联表查询格式: 主表字段名.副表字段名，例如用户表关联角色表 role.role_name
  // 分页配置
  const pageSize = 20
  const pageCurrent = 1

  const orderByMapping = {
    "ascending": "asc",
    "descending": "desc"
  }

  export default {
    data() {
      return {
        collectionList: "product_sku",
        query: '',
        where: '',
        orderby: dbOrderBy,
        orderByFieldName: "",
        selectedIndexs: [],
        options: {
          pageSize,
          pageCurrent,
          filterData: {},
          ...enumConverter
        },
        exportExcel: {
          "filename": "product_sku.xls",
          "type": "xls",
          "fields": {
            "product_id": "product_id",
            "sku_name": "sku_name",
            "price": "price",
            "specialPrice": "specialPrice",
            "stock": "stock"
          }
        },
        exportExcelData: [],
        productMap: {}
      }
    },
    onLoad() {
      this._filter = {}
    },
    onReady() {
      this.$refs.udb.loadData()
    },
    methods: {
      onqueryload(data) {
        this.exportExcelData = data
        this.populateProductInfo(data)
      },
      getWhere() {
        const query = this.query.trim()
        if (!query) {
          return ''
        }
        const queryRe = new RegExp(query, 'i')
        return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
      },
      search() {
        const newWhere = this.getWhere()
        this.where = newWhere
        this.$nextTick(() => {
          this.loadData()
        })
      },
      loadData(clear = true) {
        this.$refs.udb.loadData({
          clear
        })
      },
      onPageChanged(e) {
        this.selectedIndexs.length = 0
        this.$refs.table.clearSelection()
        this.$refs.udb.loadData({
          current: e.current
        })
      },
      navigateTo(url, clear = true) {
        uni.navigateTo({
          url,
          events: {
            refreshData: () => {
              this.loadData(clear)
            }
          }
        })
      },
      filterChange(e, name) {
        this._filter[name] = {
          type: e.filterType,
          value: e.filter
        }
        let newWhere = filterToWhere(this._filter, db.command)
        if (Object.keys(newWhere).length) {
          this.where = newWhere
        } else {
          this.where = ''
        }
        this.$nextTick(() => {
          this.$refs.udb.loadData()
        })
      },
      async populateProductInfo(data) {
        const productIds = [...new Set((data || []).map(item => item.product_id).filter(Boolean))]
        const missingIds = productIds.filter(id => !this.productMap[id])
        if (!missingIds.length) {
          return
        }
        try {
          const res = await db.collection('product').where({ _id: dbCmd.in(missingIds) }).field('_id,name,mainImage').get()
          const records = (res.result && res.result.data) || []
          records.forEach(item => {
            this.productMap[item._id] = item
          })
        } catch (error) {
          console.error('加载商品信息失败', error)
        }
      },
      // 多选处理
      selectedItems() {
        var dataList = this.$refs.udb.dataList
        return this.selectedIndexs.map(i => dataList[i]._id)
      },
      // 批量删除
      delTable() {
        this.$refs.udb.remove(this.selectedItems(), {
          success:(res) => {
            this.$refs.table.clearSelection()
          }
        })
      },
      // 多选
      selectionChange(e) {
        this.selectedIndexs = e.detail.index
      },
      confirmDelete(id) {
        this.$refs.udb.remove(id, {
          success:(res) => {
            this.$refs.table.clearSelection()
          }
        })
      },
      sortChange(e, name) {
        this.orderByFieldName = name;
        if (e.order) {
          this.orderby = name + ' ' + orderByMapping[e.order]
        } else {
          this.orderby = ''
        }
        this.$refs.table.clearSelection()
        this.$nextTick(() => {
          this.$refs.udb.loadData()
        })
      },
      getProductName(productId) {
        if (!productId) return '暂无商品'
        const product = this.productMap[productId]
        return product ? product.name : '商品信息未同步'
      },
      getProductImage(productId) {
        const product = this.productMap[productId]
        return product ? product.mainImage : ''
      }
    }
  }
</script>

<style>
.product-cell {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.product-thumb {
  width: 70rpx;
  height: 70rpx;
  border-radius: 10rpx;
  background-color: #f2f2f2;
}
.product-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.product-name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #2a221d;
}
.product-id {
  display: block;
  font-size: 22rpx;
  color: #8c8479;
}
</style>
