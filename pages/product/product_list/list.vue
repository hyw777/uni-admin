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
      <unicloud-db ref="udb" :collection="collectionList" field="name,mainImage,images,price,originalPrice,specialPrice,categoryId,subCategoryIds,brand,store_id,space_tags,sellingPoints,description,isHot,isNew,stock,sales,status,origin,rating,promotion_tag,promotion_desc,freight_fee,install_fee,service_tags,materials,dimensions,specs,pointItems,detailImages,serviceImages" :where="where" page-data="replace"
        :orderby="orderby" :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent"
        v-slot:default="{data,pagination,loading,error,options}" :options="options" loadtime="manual" @load="onqueryload">
        <uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
          <uni-tr>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'name')" sortable @sort-change="sortChange($event, 'name')">商品名称</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'mainImage')" sortable @sort-change="sortChange($event, 'mainImage')">商品主图</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'images')">商品图片</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'price')" sortable @sort-change="sortChange($event, 'price')">售价</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'originalPrice')" sortable @sort-change="sortChange($event, 'originalPrice')">原价</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'specialPrice')" sortable @sort-change="sortChange($event, 'specialPrice')">特殊价格</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'categoryId')">分类</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'subCategoryIds')">子分类</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'brand')" sortable @sort-change="sortChange($event, 'brand')">品牌</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'store_id')">商户</uni-th>
            <uni-th align="center" filter-type="select" :filter-data="options.filterData.space_tags_localdata" @filter-change="filterChange($event, 'space_tags')">适用空间</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'sellingPoints')">核心卖点</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'description')" sortable @sort-change="sortChange($event, 'description')">商品描述</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'isHot')">热门商品</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'isNew')">新品</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'stock')" sortable @sort-change="sortChange($event, 'stock')">库存</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'sales')" sortable @sort-change="sortChange($event, 'sales')">销量</uni-th>
            <uni-th align="center" filter-type="select" :filter-data="options.filterData.status_localdata" @filter-change="filterChange($event, 'status')">状态</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'origin')" sortable @sort-change="sortChange($event, 'origin')">发货地</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'rating')" sortable @sort-change="sortChange($event, 'rating')">评分</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'promotion_tag')" sortable @sort-change="sortChange($event, 'promotion_tag')">促销标签</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'promotion_desc')" sortable @sort-change="sortChange($event, 'promotion_desc')">促销描述</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'freight_fee')" sortable @sort-change="sortChange($event, 'freight_fee')">运费</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'install_fee')" sortable @sort-change="sortChange($event, 'install_fee')">送装费</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'service_tags')">服务保障</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'materials')" sortable @sort-change="sortChange($event, 'materials')">材质简要</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'dimensions')" sortable @sort-change="sortChange($event, 'dimensions')">尺寸简要</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'specs')">规格参数组</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'pointItems')">产品卖点介绍列表</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'detailImages')">商品详情长图说明</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'serviceImages')">服务保障长图说明</uni-th>
            <uni-th class="action-column" align="center">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item,index) in data" :key="index">
            <uni-td align="center">{{item.name}}</uni-td>
            <uni-td align="center">
              <image v-if="item.mainImage" :src="item.mainImage" mode="aspectFill" style="width: 50px; height: 50px; border-radius: 4px;"></image>
            </uni-td>
            <uni-td align="center">
              <view v-if="item.images && item.images.length" class="image-list-cell">
                <image v-for="(img, imgIndex) in item.images" :key="imgIndex" :src="img" mode="aspectFill" class="thumb"></image>
              </view>
            </uni-td>
            <uni-td align="center">{{item.price}}</uni-td>
            <uni-td align="center">{{item.originalPrice}}</uni-td>
            <uni-td align="center">{{item.specialPrice}}</uni-td>
            <uni-td align="center">{{getCategoryName(item.categoryId)}}</uni-td>
            <uni-td align="center">{{formatCategoryNames(item.subCategoryIds)}}</uni-td>
            <uni-td align="center">{{getBrandName(item.brand)}}</uni-td>
            <uni-td align="center">{{getStoreName(item.store_id)}}</uni-td>
            <uni-td align="center">
              <uni-data-picker :localdata="options.space_tags_valuetotext" :value="item.space_tags" :border="false" :readonly="true" split=","></uni-data-picker>
            </uni-td>
            <uni-td align="center">{{item.sellingPoints}}</uni-td>
            <uni-td align="center">{{item.description}}</uni-td>
            <uni-td align="center">{{item.isHot == true ? '✅' : '❌'}}</uni-td>
            <uni-td align="center">{{item.isNew == true ? '✅' : '❌'}}</uni-td>
            <uni-td align="center">{{item.stock}}</uni-td>
            <uni-td align="center">{{item.sales}}</uni-td>
            <uni-td align="center">{{options.status_valuetotext[item.status]}}</uni-td>
            <uni-td align="center">{{item.origin}}</uni-td>
            <uni-td align="center">{{item.rating}}</uni-td>
            <uni-td align="center">{{item.promotion_tag}}</uni-td>
            <uni-td align="center">{{item.promotion_desc}}</uni-td>
            <uni-td align="center">{{item.freight_fee}}</uni-td>
            <uni-td align="center">{{item.install_fee}}</uni-td>
            <uni-td align="center">{{item.service_tags}}</uni-td>
            <uni-td align="center">{{item.materials}}</uni-td>
            <uni-td align="center">{{item.dimensions}}</uni-td>
            <uni-td align="center">{{item.specs}}</uni-td>
            <uni-td align="center">{{item.pointItems}}</uni-td>
            <uni-td align="center">{{item.detailImages}}</uni-td>
            <uni-td align="center">{{item.serviceImages}}</uni-td>
            <uni-td class="action-column" align="center">
              <view class="uni-group action-buttons">
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
  import { enumConverter, filterToWhere } from '../../../js_sdk/validator/product.js';

  const db = uniCloud.database()
  const dbOrderBy = ''
  const dbSearchFields = []
  const pageSize = 20
  const pageCurrent = 1
  const orderByMapping = {
    "ascending": "asc",
    "descending": "desc"
  }

  export default {
    data() {
      return {
        collectionList: "product",
        query: '',
        where: '',
        orderby: dbOrderBy,
        orderByFieldName: "",
        selectedIndexs: [],
        _filter: {},
        options: {
          pageSize,
          pageCurrent,
          filterData: {
            "space_tags_localdata": [
              { "value": "精选", "text": "精选" },
              { "value": "客厅", "text": "客厅" },
              { "value": "餐厅", "text": "餐厅" },
              { "value": "卧室", "text": "卧室" },
              { "value": "儿童房", "text": "儿童房" },
              { "value": "书房", "text": "书房" },
              { "value": "灯饰", "text": "灯饰" },
              { "value": "卫浴", "text": "卫浴" }
            ],
            "status_localdata": [
              { "value": 0, "text": "下架" },
              { "value": 1, "text": "上架" }
            ]
          },
          ...enumConverter
        },
        imageStyles: {
          width: 64,
          height: 64
        },
        exportExcel: {
          "filename": "product.xls",
          "type": "xls",
          "fields": {
            "商品名称": "name",
            "商品主图": "mainImage",
            "商品图片": "images",
            "售价": "price",
            "原价": "originalPrice",
            "特殊价格": "specialPrice",
            "分类ID": "categoryId",
            "二级分类ID": "subCategoryIds",
            "品牌": "brand",
            "商户": "storeName",
            "适用空间": "space_tags",
            "核心卖点": "sellingPoints",
            "商品描述": "description",
            "热门商品": "isHot",
            "新品": "isNew",
            "库存": "stock",
            "销量": "sales",
            "状态": "status",
            "发货地": "origin",
            "评分": "rating",
            "促销标签": "promotion_tag",
            "促销描述": "promotion_desc",
            "运费": "freight_fee",
            "送装费": "install_fee",
            "服务保障": "service_tags",
            "材质简要": "materials",
            "尺寸简要": "dimensions",
            "规格参数组": "specs",
            "产品卖点介绍列表": "pointItems",
            "商品详情长图说明": "detailImages",
            "服务保障长图说明": "serviceImages"
          }
        },
        exportExcelData: [],
        categoryMap: {},
        brandMap: {},
        storeMap: {}
      }
    },
    onLoad() {
      this._filter = {}
    },
    onReady() {
      Promise.all([this.loadCategoryData(), this.loadBrandData(), this.loadStoreData()])
        .catch(() => {})
        .finally(() => {
          this.$refs.udb.loadData()
        })
    },
    methods: {
      onqueryload(data) {
        this.exportExcelData = data.map(item => ({
          ...item,
          storeName: this.getStoreName(item.store_id)
        }))
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
      navigateTo(url, clear) {
        uni.navigateTo({
          url,
          events: {
            refreshData: () => {
              this.loadData(clear)
            }
          }
        })
      },
      selectedItems() {
        const dataList = this.$refs.udb.dataList || []
        return this.selectedIndexs.map(i => dataList[i]._id)
      },
      delTable() {
        this.$refs.udb.remove(this.selectedItems(), {
          success: () => {
            this.$refs.table.clearSelection()
          }
        })
      },
      selectionChange(e) {
        this.selectedIndexs = e.detail.index
      },
      confirmDelete(id) {
        this.$refs.udb.remove(id, {
          success: () => {
            this.$refs.table.clearSelection()
          }
        })
      },
      sortChange(e, name) {
        this.orderByFieldName = name
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
      filterChange(e, name) {
        this._filter[name] = {
          type: e.filterType,
          value: e.filter
        }
        const newWhere = filterToWhere(this._filter, db.command)
        if (Object.keys(newWhere).length) {
          this.where = newWhere
        } else {
          this.where = ''
        }
        this.$nextTick(() => {
          this.$refs.udb.loadData()
        })
      },
      loadCategoryData() {
        return db.collection('category').field('_id,name,parentId,level').orderBy('sort', 'asc').get().then((res) => {
          const list = (res.result && res.result.data) || []
          const parentMap = {}
          list.forEach((item) => {
            if (item.level === 1) {
              parentMap[item._id] = item.name
            }
          })
          const map = {}
          list.forEach((item) => {
            const parentName = parentMap[item.parentId] || ''
            map[item._id] = {
              ...item,
              parentName,
              label: parentName ? `${parentName} / ${item.name}` : item.name
            }
          })
          this.categoryMap = map
        })
      },
      loadBrandData() {
        return db.collection('brand').field('_id,name').orderBy('sort', 'asc').get().then((res) => {
          const list = (res.result && res.result.data) || []
          const map = {}
          list.forEach((item) => {
            if (item && item._id) {
              map[item._id] = item.name || ''
            }
          })
          this.brandMap = map
        })
      },
      loadStoreData() {
        return db.collection('store').field('_id,name').orderBy('name', 'asc').get().then((res) => {
          const list = (res.result && res.result.data) || []
          const map = {}
          list.forEach((item) => {
            if (item && item._id) {
              map[item._id] = item.name || ''
            }
          })
          this.storeMap = map
        })
      },
      getCategoryName(id) {
        if (!id) {
          return '暂时无分类'
        }
        return (this.categoryMap[id] && this.categoryMap[id].label) || '暂时无分类'
      },
      getBrandName(id) {
        if (!id) {
          return '暂时无品牌'
        }
        return this.brandMap[id] || '暂时无品牌'
      },
      getStoreName(id) {
        if (!id) {
          return '暂无商户'
        }
        return this.storeMap[id] || '未知商户'
      },
      formatCategoryNames(ids) {
        if (!Array.isArray(ids) || !ids.length) {
          return ''
        }
        return ids.map(id => this.getCategoryName(id)).join('、')
      }
    }
  }
</script>

<style>
.image-list-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.image-list-cell .thumb {
  width: 42px;
  height: 42px;
  border-radius: 4px;
}

.action-column {
  position: sticky;
  right: 0;
  background: #fff;
  z-index: 3;
}
.action-column.uni-th {
  z-index: 4;
}
.action-column.uni-td {
  z-index: 2;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
</style>
