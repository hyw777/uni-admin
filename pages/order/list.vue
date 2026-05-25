<template>
  <view>
    <!-- Header -->
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title"></view>
        <view class="uni-sub-title"></view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="doSearch" placeholder="搜索订单号/商品/收货人" />
        <button class="uni-button" type="default" size="mini" @click="doSearch">搜索</button>
        <button class="uni-button" type="primary" size="mini" @click="openBatchShip">批量发货</button>
        <download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
          <button class="uni-button" type="default" size="mini">导出</button>
        </download-excel>
      </view>
    </view>

    <!-- 状态筛选按钮组 -->
    <view class="status-filter-bar">
      <view
        v-for="s in statusFilterOptions"
        :key="s.value"
        :class="['sfb-item', currentStatusFilter === s.value ? 'sfb-active' : '']"
        @click="switchStatusFilter(s.value)"
      >{{ s.text }}</view>
    </view>

    <!-- 列表 -->
    <view class="uni-container">
      <unicloud-db
        ref="udb"
        :collection="collectionList"
        field="order_type,items,total_fee,status,store_id,redemption_store_name,redemption_store_address,redemption_store_mobile,delivery_method,logistics_company,logistics_no,installation_status,address,user_id,create_date"
        :where="effectiveWhere"
        page-data="replace"
        :orderby="orderby"
        :getcount="true"
        :page-size="options.pageSize"
        :page-current="options.pageCurrent"
        v-slot:default="{data,pagination,loading,error,options}"
        :options="options"
        loadtime="manual"
        @load="onqueryload"
      >
        <uni-table ref="table" :loading="loading" :emptyText="error.message || '暂无订单'" border stripe type="selection" @selection-change="selectionChange">
          <uni-tr>
            <uni-th align="center" filter-type="select" @filter-change="filterChange($event, 'status')" sortable @sort-change="sortChange($event, 'status')">状态</uni-th>
            <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'create_date')" sortable @sort-change="sortChange($event, 'create_date')">下单时间</uni-th>
            <uni-th align="center">商品信息</uni-th>
            <uni-th align="center">收货信息</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'total_fee')" sortable @sort-change="sortChange($event, 'total_fee')">实付金额</uni-th>
            <uni-th align="center" filter-type="select" @filter-change="filterChange($event, 'delivery_method')">配送方式</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'logistics_company')">快递公司</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'logistics_no')">快递单号</uni-th>
            <uni-th align="center">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item,index) in data" :key="index">
            <uni-td align="center">
              <view :class="['status-badge', 'status-' + item.status]">{{ statusText(item.status) }}</view>
            </uni-td>
            <uni-td align="center">
              <uni-dateformat :threshold="[0, 0]" :date="item.create_date" format="yyyy-MM-dd HH:mm"></uni-dateformat>
            </uni-td>
            <uni-td align="left" style="min-width: 200px;">
              <view v-if="item.items && item.items.length">
                <view v-for="(goods, gi) in item.items" :key="gi" class="goods-item">
                  <image v-if="goods.image" :src="goods.image" class="goods-thumb" mode="aspectFill"></image>
                  <view v-else class="goods-thumb goods-thumb-placeholder">无图</view>
                  <view class="goods-info">
                    <text class="goods-title">{{ goods.title || '商品' + (gi + 1) }}</text>
                    <text class="goods-sub">x{{ goods.quantity }} &nbsp; 单价{{ (goods.price / 100).toFixed(2) }}元</text>
                  </view>
                </view>
              </view>
              <text v-else>-</text>
            </uni-td>
            <uni-td align="left" style="min-width: 160px;">
              <view v-if="item.address && item.address.name">
                <view>{{ item.address.name }} {{ item.address.mobile }}</view>
                <view class="address-text">{{ formatAddress(item.address) }}</view>
              </view>
              <view v-else-if="item.redemption_store_name">
                <view class="verify-tag">到店核销</view>
                <view>{{ item.redemption_store_name }}</view>
                <view class="address-text">{{ item.redemption_store_address }}</view>
                <view class="address-text">{{ item.redemption_store_mobile }}</view>
              </view>
              <text v-else>-</text>
            </uni-td>
            <uni-td align="center">
              <text class="price-text">¥{{ (item.total_fee / 100).toFixed(2) }}</text>
            </uni-td>
            <uni-td align="center">
              <text>{{ deliveryMethodText(item.delivery_method) }}</text>
            </uni-td>
            <uni-td align="center">{{ logisticsCompanyName(item.logistics_company) }}</uni-td>
            <uni-td align="center">
              <text v-if="item.logistics_no" class="logistics-no">{{ item.logistics_no }}</text>
              <text v-else>-</text>
            </uni-td>
            <uni-td align="center">
              <view class="op-group">
                <!-- 普通订单待发货状态显示发货按钮，团购订单（到店核销）不显示 -->
                <button v-if="item.status === 1 && item.order_type !== 'group_offline'" @click="openShipDialog(item)" class="uni-button" size="mini" type="primary">发货</button>
                <text v-else class="op-text">{{ statusText(item) }}</text>
                <button v-if="item.status === -1 || item.status === 1" @click="confirmDelete(item._id)" class="uni-button" size="mini" type="warn">删除</button>
              </view>
            </uni-td>
          </uni-tr>
        </uni-table>
        <view class="uni-pagination-box">
          <uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
        </view>
      </unicloud-db>
    </view>

    <!-- 单个发货弹窗（纯 uni-popup，彻底解决 picker 兼容问题） -->
    <uni-popup ref="shipPopup" type="bottom">
      <view class="ship-popup">
        <!-- 标题栏 -->
        <view class="ship-popup-header">
          <text class="ship-popup-title">订单发货</text>
          <text class="ship-popup-sub" v-if="shipTarget">单号：{{ shipTarget._id.substring(0, 12) }}...</text>
          <text class="ship-popup-close" @click="closeShipDialog">×</text>
        </view>

        <!-- 表单内容 -->
        <view class="ship-popup-body">
          <!-- 配送方式：点击弹出选项列表 -->
          <view class="ship-field">
            <text class="ship-field-label">配送方式 <text class="required">*</text></text>
            <view class="option-list">
              <view
                v-for="opt in deliveryMethodOptions"
                :key="opt.value"
                :class="['option-item', shipForm.delivery_method === opt.value ? 'option-item-active' : '']"
                @click="shipForm.delivery_method = opt.value"
              >{{ opt.text }}</view>
            </view>
          </view>

          <!-- 快递公司：点击弹出选项列表 -->
          <view class="ship-field">
            <text class="ship-field-label">快递公司 <text class="required">*</text></text>
            <view class="option-grid">
              <view
                v-for="opt in logisticsCompanyOptions"
                :key="opt.value"
                :class="['option-item', shipForm.logistics_company === opt.value ? 'option-item-active' : '']"
                @click="shipForm.logistics_company = opt.value"
              >{{ opt.text }}</view>
            </view>
          </view>

          <!-- 快递单号 -->
          <view class="ship-field">
            <text class="ship-field-label">快递单号 <text class="required">*</text></text>
            <uni-easyinput v-model="shipForm.logistics_no" placeholder="请填写快递单号" />
          </view>
        </view>

        <!-- 确认按钮 -->
        <view class="ship-popup-footer">
          <button type="primary" class="ship-confirm-btn" @click="doSingleShip">确认发货</button>
        </view>
      </view>
    </uni-popup>

    <!-- 批量发货弹窗 -->
    <uni-popup ref="batchShipPopup" type="bottom">
      <view class="ship-popup">
        <view class="ship-popup-header">
          <text class="ship-popup-title">批量发货</text>
          <text class="ship-popup-close" @click="closeBatchShipDialog">×</text>
        </view>
        <view class="ship-popup-body">
          <view class="batch-tip">
            <text>上传 Excel/CSV，格式：</text>
            <view class="batch-example">
              <text>第一列：订单ID（完整ID）</text>
              <text>第二列：物流单号</text>
              <text class="batch-note">提示：Excel 第一行为表头（可留空），从第二行开始为数据</text>
            </view>
          </view>
          <view class="upload-wrap">
            <button size="mini" type="primary" @click="chooseBatchFile">{{ batchFileName || '选择 Excel/CSV 文件' }}</button>
            <text v-if="batchFileName" class="file-name">{{ batchFileName }}</text>
          </view>
          <view v-if="batchPreview.length" class="batch-preview">
            <view class="batch-preview-title">预览（前5条）：</view>
            <view v-for="(row, idx) in batchPreview" :key="idx" class="batch-preview-row">
              <text>订单：{{ row.orderId.substring(0, 12) }}...</text>
              <text>单号：{{ row.logisticsNo }}</text>
            </view>
          </view>
          <view v-if="batchErrorMsg" class="batch-error">{{ batchErrorMsg }}</view>
        </view>
        <view class="ship-popup-footer">
          <button type="primary" class="ship-confirm-btn" :disabled="!Object.keys(batchOrdersMap).length" @click="doBatchShip">确认批量发货</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../js_sdk/validator/order.js';

const STATUS_FILTER_OPTIONS = [
  { text: '全部', value: null },
  { text: '待支付', value: 0 },
  { text: '待发货', value: 1 },
  { text: '已发货', value: 2 },
  { text: '已完成', value: 3 },
  { text: '已取消', value: -1 }
]

const db = uniCloud.database()
const dbCmd = db.command
const dbOrderBy = 'create_date desc'
const pageSize = 20
const pageCurrent = 1

const orderByMapping = {
  "ascending": "asc",
  "descending": "desc"
}

export default {
  data() {
    return {
      collectionList: "order",
      query: '',
      // 基础条件：当前选中状态（默认待发货 = 1）
      currentStatusFilter: 1,
      // 列筛选条件（由 filterChange 维护）
      columnFilter: {},
      // 搜索关键词条件
      searchWhere: '',
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
        "filename": "订单.xls",
        "type": "xls",
        "fields": {
          "_id": "订单ID",
          "order_type": "订单类型",
          "items": "商品明细",
          "total_fee": "实付金额(分)",
          "status": "状态",
          "redemption_store_name": "核销门店",
          "delivery_method": "配送方式",
          "logistics_company": "快递公司",
          "logistics_no": "快递单号",
          "create_date": "下单时间"
        }
      },
      exportExcelData: [],

      // 发货相关
      shipTarget: null,
      shipForm: {
        delivery_method: 1,
        logistics_company: '',
        logistics_no: ''
      },
      logisticsCompanyOptions: [
        { text: '顺丰速运', value: 'shunfeng' },
        { text: '圆通速递', value: 'yuantong' },
        { text: '中通快递', value: 'zhongtong' },
        { text: '韵达快递', value: 'yunda' },
        { text: '申通快递', value: 'shentong' },
        { text: '极兔速递', value: 'jtexpress' },
        { text: '京东物流', value: 'jd' },
        { text: '邮政EMS', value: 'ems' },
        { text: '德邦快递', value: 'debangkuaidi' },
        { text: '中国邮政', value: 'youzhengguonei' },
        { text: '德邦物流', value: 'debangwuliu' },
        { text: '跨越速运', value: 'kuayue' },
        { text: '安能物流', value: 'annengwuliu' },
        { text: '百世快运', value: 'baishiwuliu' },
        { text: '宅急送', value: 'zhaijisong' },
        { text: '苏宁物流', value: 'suning' },
        { text: 'UPS', value: 'ups' },
        { text: 'DHL', value: 'dhl' },
        { text: 'FedEx', value: 'fedex' },
        { text: '其他', value: 'other' }
      ],
      deliveryMethodOptions: [
        { text: '快递', value: 1 },
        { text: '大件物流', value: 2 },
        { text: '送货入户带安装', value: 3 },
        { text: '同城车队', value: 4 }
      ],

      // 批量发货
      batchFileName: '',
      batchPreview: [],
      batchErrorMsg: '',
      batchOrdersMap: {},

      // 状态筛选
      statusFilterOptions: STATUS_FILTER_OPTIONS
    }
  },
  computed: {
    // 合并所有条件
    effectiveWhere() {
      const parts = []
      // 状态条件（header 按钮组控制）
      if (this.currentStatusFilter !== null) {
        parts.push(`status == ${this.currentStatusFilter}`)
      }
      // 列筛选条件
      if (Object.keys(this.columnFilter).length) {
        const cf = filterToWhere(this.columnFilter, dbCmd)
        for (const key in cf) {
          // 特殊处理：列筛选中如果选了状态，覆盖基础状态
          if (key === 'status') {
            const idx = parts.findIndex(p => p.startsWith('status =='))
            if (idx >= 0) parts.splice(idx, 1)
          }
          parts.push(cf[key].toJSON ? cf[key].toJSON() : cf[key])
        }
      }
      // 搜索条件
      if (this.searchWhere) {
        parts.push(this.searchWhere)
      }
      return parts.join(' && ')
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
    // header 状态切换
    switchStatusFilter(val) {
      this.currentStatusFilter = val
      this.columnFilter = {} // 切换状态时清除列筛选，避免混淆
      this.$refs.table.clearSelection()
      this.$nextTick(() => { this.$refs.udb.loadData({ clear: true }) })
    },
    doSearch() {
      const q = this.query.trim()
      if (!q) {
        this.searchWhere = ''
      } else {
        const re = new RegExp(q, 'i')
        this.searchWhere = `items.title ~= "${q}" || _id ~= "${q}" || logistics_no ~= "${q}"`
      }
      this.$nextTick(() => { this.$refs.udb.loadData({ clear: true }) })
    },
    loadData(clear = true) {
      this.$refs.udb.loadData({ clear })
    },
    onPageChanged(e) {
      this.selectedIndexs.length = 0
      this.$refs.table.clearSelection()
      this.$refs.udb.loadData({ current: e.current })
    },
    selectionChange(e) {
      this.selectedIndexs = e.detail.index
    },
    sortChange(e, name) {
      this.orderByFieldName = name
      if (e.order) {
        this.orderby = name + ' ' + orderByMapping[e.order]
      } else {
        this.orderby = dbOrderBy
      }
      this.$refs.table.clearSelection()
      this.$nextTick(() => { this.$refs.udb.loadData() })
    },
    filterChange(e, name) {
      this.columnFilter[name] = { type: e.filterType, value: e.filter }
      this.$nextTick(() => { this.$refs.udb.loadData() })
    },
    confirmDelete(id) {
      uni.showModal({
        title: '确认删除',
        content: '确定删除该订单？此操作不可恢复',
        success: (res) => {
          if (res.confirm) this.$refs.udb.remove(id)
        }
      })
    },

    // ── 文本映射 ──────────────────────────────────
    statusText(item) {
      const status = typeof item === 'object' ? item.status : item
      const orderType = typeof item === 'object' ? item.order_type : ''
      const statusMap = { 0: '待支付', 1: '待发货', 2: '已发货', 3: '已完成', '-1': '已取消' }
      // 团购订单（到店核销）特殊状态
      if (orderType === 'group_offline') {
        const groupStatusMap = { 0: '待支付', 1: '待使用', 2: '待使用', 3: '已完成', '-1': '已取消' }
        return groupStatusMap[status] ?? status
      }
      return statusMap[status] ?? status
    },
    deliveryMethodText(v) {
      const map = { 1: '快递', 2: '大件物流', 3: '送货入户带安装', 4: '同城车队' }
      return map[v] ?? '-'
    },
    logisticsCompanyName(code) {
      const map = {
        'shunfeng': '顺丰速运', 'yuantong': '圆通速递', 'zhongtong': '中通快递',
        'yunda': '韵达快递', 'shentong': '申通快递', 'jtexpress': '极兔速递',
        'jd': '京东物流', 'ems': '邮政EMS', 'debangkuaidi': '德邦快递',
        'youzhengguonei': '中国邮政', 'debangwuliu': '德邦物流', 'kuayue': '跨越速运',
        'annengwuliu': '安能物流', 'baishiwuliu': '百世快运', 'zhaijisong': '宅急送',
        'suning': '苏宁物流', 'ups': 'UPS', 'dhl': 'DHL', 'fedex': 'FedEx',
        'other': '其他'
      }
      return map[code] || code || '-'
    },
    formatAddress(addr) {
      if (!addr) return '-'
      return [addr.province, addr.city, addr.district, addr.address].filter(Boolean).join('')
    },

    // ── 单个发货 ──────────────────────────────────
    openShipDialog(item) {
      this.shipTarget = item
      this.shipForm = {
        delivery_method: item.delivery_method || 1,
        logistics_company: item.logistics_company || '',
        logistics_no: item.logistics_no || ''
      }
      this.$refs.shipPopup.open()
    },
    closeShipDialog() {
      this.$refs.shipPopup.close()
      this.shipTarget = null
    },
    doSingleShip() {
      if (!this.shipForm.logistics_company.trim()) {
        uni.showToast({ title: '请选择快递公司', icon: 'none' })
        return
      }
      if (!this.shipForm.logistics_no.trim()) {
        uni.showToast({ title: '请填写快递单号', icon: 'none' })
        return
      }
      uni.showLoading({ mask: true })
      db.collection('order').doc(this.shipTarget._id).update({
        status: 2,
        delivery_method: this.shipForm.delivery_method,
        logistics_company: this.shipForm.logistics_company,
        logistics_no: this.shipForm.logistics_no.trim()
      }).then(() => {
        uni.showToast({ title: '发货成功' })
        this.closeShipDialog()
        this.$nextTick(() => { this.$refs.udb.loadData() })
      }).catch(err => {
        uni.showModal({ title: '发货失败', content: err.message, showCancel: false })
      }).finally(() => {
        uni.hideLoading()
      })
    },

    // ── 批量发货 ──────────────────────────────────
    openBatchShip() {
      this.batchFileName = ''
      this.batchPreview = []
      this.batchErrorMsg = ''
      this.batchOrdersMap = {}
      this.$refs.batchShipPopup.open()
    },
    closeBatchShipDialog() {
      this.$refs.batchShipPopup.close()
    },
    chooseBatchFile() {
      // #ifdef H5
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.xlsx,.xls,.csv'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          this.batchFileName = file.name
          this.parseBatchFile(file)
        }
      }
      input.click()
      // #endif
      // #ifndef H5
      uni.chooseFile({
        count: 1,
        type: 'file',
        extension: ['.xlsx', '.xls', '.csv'],
        success: (res) => {
          const file = res.tempFiles[0]
          this.batchFileName = file.name || '已选择文件'
          this.parseBatchFile(file)
        },
        fail: () => {
          uni.showToast({ title: '未选择文件', icon: 'none' })
        }
      })
      // #endif
    },
    parseBatchFile(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.trim().split('\n')
          if (lines.length < 2) {
            this.batchErrorMsg = '文件为空或格式错误'
            return
          }
          const preview = []
          const orderMap = {}
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',')
            if (cols.length < 2) continue
            const orderId = (cols[0] || '').trim().replace(/"/g, '').trim()
            const logisticsNo = (cols[1] || '').trim().replace(/"/g, '').trim()
            if (!orderId || !logisticsNo) continue
            orderMap[orderId] = logisticsNo
            if (preview.length < 5) preview.push({ orderId, logisticsNo })
          }
          if (!Object.keys(orderMap).length) {
            this.batchErrorMsg = '未解析到有效数据，请确保第一列为订单ID，第二列为物流单号'
            return
          }
          this.batchOrdersMap = orderMap
          this.batchPreview = preview
          this.batchErrorMsg = ''
        } catch (err) {
          this.batchErrorMsg = '解析失败：' + err.message
        }
      }
      reader.readAsText(file)
    },
    doBatchShip() {
      const orderIds = Object.keys(this.batchOrdersMap)
      if (!orderIds.length) {
        uni.showToast({ title: '请先选择有效文件', icon: 'none' })
        return
      }
      uni.showLoading({ mask: true, title: '批量发货中…' })
      const promises = orderIds.map(id =>
        db.collection('order').doc(id).update({
          status: 2,
          logistics_no: this.batchOrdersMap[id],
          logistics_company: 'shunfeng',
          delivery_method: 1
        }).catch(() => null)
      )
      Promise.all(promises).then(results => {
        const success = results.filter(Boolean).length
        const fail = results.filter(r => !r).length
        uni.showToast({ title: `成功${success}条${fail ? '，失败' + fail + '条' : ''}`, icon: 'none', duration: 3000 })
        this.closeBatchShipDialog()
        this.$nextTick(() => { this.$refs.udb.loadData() })
      }).finally(() => {
        uni.hideLoading()
      })
    }
  }
}
</script>

<style scoped>
/* 状态筛选按钮组 */
.status-filter-bar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
}
.sfb-item {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.sfb-active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 18px;
}
.status-0 { background: #fff7e6; color: #fa8c16; }
.status-1 { background: #e6f7ff; color: #1890ff; }
.status-2 { background: #f6ffed; color: #52c41a; }
.status-3 { background: #f0f0f0; color: #8c8c8c; }
.status---1 { background: #fff1f0; color: #ff4d4f; }

/* 商品行 */
.goods-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.goods-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
}
.goods-thumb-placeholder {
  background: #f0f0f0;
  color: #999;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.goods-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.goods-title {
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.goods-sub { font-size: 11px; color: #999; }

/* 地址 */
.address-text { font-size: 12px; color: #666; word-break: break-all; }
.verify-tag {
  display: inline-block;
  background: #fff7e6;
  color: #fa8c16;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 8px;
  margin-bottom: 2px;
}

/* 金额 */
.price-text { color: #ff4d4f; font-weight: bold; font-size: 14px; }

/* 快递单号 */
.logistics-no { font-family: monospace; font-size: 12px; color: #1890ff; }

/* 操作列 */
.op-group { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.op-text { font-size: 12px; color: #999; }

/* 发货弹窗（底部弹出） */
.ship-popup {
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ship-popup-header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.ship-popup-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  flex: 1;
}
.ship-popup-sub {
  font-size: 12px;
  color: #999;
  flex: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ship-popup-close {
  font-size: 22px;
  color: #999;
  padding: 0 4px;
  line-height: 1;
}
.ship-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.ship-popup-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

/* 发货表单字段 */
.ship-field {
  margin-bottom: 16px;
}
.ship-field-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}
.required { color: #ff4d4f; }

/* 选项列表（配送方式） */
.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.option-item {
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  font-size: 13px;
  color: #666;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.option-item-active {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

/* 确认发货按钮 */
.ship-confirm-btn {
  width: 100%;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  height: 44px;
  line-height: 44px;
}

/* 批量发货 */
.batch-tip { font-size: 13px; color: #666; margin-bottom: 12px; }
.batch-example {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px 12px;
  margin: 6px 0;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.batch-note { color: #999; }
.upload-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.file-name { font-size: 12px; color: #52c41a; }
.batch-preview {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}
.batch-preview-title { font-size: 12px; color: #666; margin-bottom: 6px; }
.batch-preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #333;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}
.batch-error { color: #ff4d4f; font-size: 12px; }
</style>
