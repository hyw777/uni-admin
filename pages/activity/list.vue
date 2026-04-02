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
      <unicloud-db ref="udb" :collection="collectionList" field="title,type,image,description,discount,fullAmount,reduceAmount,couponValue,couponMinAmount,startTime,endTime,sort,status" :where="where" page-data="replace"
        :orderby="orderby" :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent"
        v-slot:default="{data,pagination,loading,error,options}" :options="options" loadtime="manual" @load="onqueryload">
        <uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
          <uni-tr>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'title')" sortable @sort-change="sortChange($event, 'title')">活动标题</uni-th>
            <uni-th align="center" filter-type="select" :filter-data="options.filterData.type_localdata" @filter-change="filterChange($event, 'type')">活动类型</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'image')" sortable @sort-change="sortChange($event, 'image')">活动图片</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'description')" sortable @sort-change="sortChange($event, 'description')">活动描述</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'discount')" sortable @sort-change="sortChange($event, 'discount')">折扣</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'fullAmount')" sortable @sort-change="sortChange($event, 'fullAmount')">满减金额</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'reduceAmount')" sortable @sort-change="sortChange($event, 'reduceAmount')">减多少</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'couponValue')" sortable @sort-change="sortChange($event, 'couponValue')">优惠券金额</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'couponMinAmount')" sortable @sort-change="sortChange($event, 'couponMinAmount')">最低使用金额</uni-th>
            <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'startTime')" sortable @sort-change="sortChange($event, 'startTime')">开始时间</uni-th>
            <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'endTime')" sortable @sort-change="sortChange($event, 'endTime')">结束时间</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'sort')" sortable @sort-change="sortChange($event, 'sort')">排序</uni-th>
            <uni-th align="center" filter-type="select" :filter-data="options.filterData.status_localdata" @filter-change="filterChange($event, 'status')">状态</uni-th>
            <uni-th align="center">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item,index) in data" :key="index">
            <uni-td align="center">{{item.title}}</uni-td>
            <uni-td align="center">{{options.type_valuetotext[item.type]}}</uni-td>
            <uni-td align="center"><image v-if="item.image" :src="item.image" mode="aspectFit" style="width: 50px; height: 50px;"></image></uni-td>
            <uni-td align="center">{{item.description}}</uni-td>
            <uni-td align="center">{{item.discount}}</uni-td>
            <uni-td align="center">{{item.fullAmount}}</uni-td>
            <uni-td align="center">{{item.reduceAmount}}</uni-td>
            <uni-td align="center">{{item.couponValue}}</uni-td>
            <uni-td align="center">{{item.couponMinAmount}}</uni-td>
            <uni-td align="center">
              <uni-dateformat :threshold="[0, 0]" :date="item.startTime"></uni-dateformat>
            </uni-td>
            <uni-td align="center">
              <uni-dateformat :threshold="[0, 0]" :date="item.endTime"></uni-dateformat>
            </uni-td>
            <uni-td align="center">{{item.sort}}</uni-td>
            <uni-td align="center">{{options.status_valuetotext[item.status]}}</uni-td>
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
  import { enumConverter, filterToWhere } from '../../js_sdk/validator/activity.js';

  const db = uniCloud.database()
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
        collectionList: "activity",
        query: '',
        where: '',
        orderby: dbOrderBy,
        orderByFieldName: "",
        selectedIndexs: [],
        options: {
          pageSize,
          pageCurrent,
          filterData: {
            "type_localdata": [
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
            ],
            "status_localdata": [
              {
                "value": 0,
                "text": "禁用"
              },
              {
                "value": 1,
                "text": "启用"
              }
            ]
          },
          ...enumConverter
        },
        imageStyles: {
          width: 64,
          height: 64
        },
        exportExcel: {
          "filename": "activity.xls",
          "type": "xls",
          "fields": {
            "活动标题": "title",
            "活动类型": "type",
            "活动图片": "image",
            "活动描述": "description",
            "折扣": "discount",
            "满减金额": "fullAmount",
            "减多少": "reduceAmount",
            "优惠券金额": "couponValue",
            "最低使用金额": "couponMinAmount",
            "开始时间": "startTime",
            "结束时间": "endTime",
            "排序": "sort",
            "状态": "status"
          }
        },
        exportExcelData: []
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
        // clear 表示刷新列表时是否清除页码，true 表示刷新并回到列表第 1 页，默认为 true
        uni.navigateTo({
          url,
          events: {
            refreshData: () => {
              this.loadData(clear)
            }
          }
        })
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
      }
    }
  }
</script>

<style>
</style>
