<template>
  <view class="as-container">
    <!-- 统计概览 -->
    <view class="as-stats">
      <view class="as-stat-item" v-for="s in statsCards" :key="s.key" :class="'stat-' + s.key" @click="switchStatusFilter(s.key)">
        <text class="stat-num">{{ stats[s.key] || 0 }}</text>
        <text class="stat-label">{{ s.label }}</text>
      </view>
    </view>

    <!-- 搜索与筛选栏 -->
    <view class="as-header">
      <view class="as-search-wrap">
        <input class="as-search" v-model="searchKey" placeholder="搜索订单ID" @confirm="doSearch" />
      </view>
      <view class="as-filter-tabs">
        <view
          v-for="s in statusFilterTabs"
          :key="s.value"
          :class="['as-tab', activeTab === s.value ? 'as-tab-active' : '']"
          @click="switchTab(s.value)"
        >{{ s.label }}</view>
      </view>
      <button class="as-btn-migrate" size="mini" :loading="isMigrating" @click="backfillSnapshots">修复商品快照</button>
      <button class="as-btn-migrate" size="mini" :disabled="!selectedIndexs.length" style="color: #c0392b; border-color: #c0392b; margin-left: 8px;" @click="delTable">批量删除</button>
    </view>

    <!-- 数据表格 -->
    <unicloud-db
      ref="udb"
      collection="after_sale_record"
      field="_id,order_id,goods_id,sku_id,refund_type,reason,description,images,refund_amount,status,return_logistics_company,return_logistics_no,reject_reason,goods_snapshot,uid,refund_time,refund_result,create_time,update_time"
      :where="queryWhere"
      orderby="create_time desc"
      page-data="replace"
      :page-size="pageSize"
      :page-current="pageCurrent"
      @load="onDataLoad"
      v-slot:default="{data, pagination, loading, error}"
    >
      <view v-if="error" class="as-error">{{ error.message }}</view>
      <view v-else-if="loading" class="as-loading">加载中...</view>
      <template v-else>
        <uni-table ref="table" border stripe type="selection" @selection-change="selectionChange" emptyText="暂无售后记录">
          <uni-tr>
            <uni-th align="center" width="160">商品信息</uni-th>
            <uni-th align="center" width="140">订单编号</uni-th>
            <uni-th align="center" width="90">售后类型</uni-th>
            <uni-th align="center" width="90">退款金额</uni-th>
            <uni-th align="center" width="110">售后原因</uni-th>
            <uni-th align="center" width="90">当前状态</uni-th>
            <uni-th align="center" width="140">申请时间</uni-th>
            <uni-th align="center" width="210">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="item in data" :key="item._id">
            <uni-td>
              <view class="as-goods-cell" v-if="item.goods_snapshot">
                <image class="as-goods-thumb" :src="item.goods_snapshot.image" mode="aspectFill" @click="previewImages([item.goods_snapshot.image], 0)"></image>
                <view class="as-goods-text">
                  <text class="as-goods-name">{{ item.goods_snapshot.title || '-' }}</text>
                  <text class="as-goods-sku" v-if="item.goods_snapshot.sku_name">{{ item.goods_snapshot.sku_name }}</text>
                </view>
              </view>
              <text v-else class="as-reason">-</text>
            </uni-td>
            <uni-td align="center">
              <text class="as-order-id" @click="viewDetail(item)">{{ item.order_id }}</text>
            </uni-td>
            <uni-td align="center">
              <text :class="['as-type-tag', item.refund_type === 'return_refund' ? 'type-return' : 'type-refund']">
                {{ item.refund_type === 'return_refund' ? '退货退款' : item.refund_type === 'exchange' ? '换货' : '仅退款' }}
              </text>
            </uni-td>
            <uni-td align="center">
              <text class="as-amount">¥{{ formatMoney(item.refund_amount) }}</text>
            </uni-td>
            <uni-td align="center">
              <text class="as-reason">{{ item.reason || '-' }}</text>
            </uni-td>
            <uni-td align="center">
              <text :class="['as-status-badge', 'status-' + item.status]">{{ statusMap[item.status] || item.status }}</text>
            </uni-td>
            <uni-td align="center">
              <uni-dateformat :date="item.create_time" format="yyyy-MM-dd hh:mm" />
            </uni-td>
            <uni-td align="center">
              <view class="as-actions">
                <!-- 仅退款待处理 -->
                <button v-if="item.status === 'pending' && item.refund_type !== 'return_refund'" class="as-btn as-btn-primary" size="mini" @click="handleAgreeRefund(item)">同意退款</button>
                <!-- 退货退款待处理 -->
                <button v-if="item.status === 'pending' && item.refund_type === 'return_refund'" class="as-btn as-btn-primary" size="mini" @click="handleAgreeReturn(item)">同意退货</button>
                <!-- 待处理可拒绝 -->
                <button v-if="item.status === 'pending'" class="as-btn as-btn-danger" size="mini" @click="handleReject(item)">拒绝</button>
                <!-- 已发货待收货确认 -->
                <button v-if="item.status === 'returning_shipped'" class="as-btn as-btn-success" size="mini" @click="handleConfirmReceived(item)">确认收货退款</button>
                <!-- 查看详情 -->
                <button class="as-btn as-btn-outline" size="mini" @click="viewDetail(item)">详情</button>
              </view>
            </uni-td>
          </uni-tr>
        </uni-table>
        <view class="as-pagination" v-if="data.length > 0">
          <uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChange" />
        </view>
      </template>
    </unicloud-db>

    <!-- 详情弹窗 -->
    <uni-popup ref="detailPopup" type="center" :mask-click="true">
      <view class="as-detail-card">
        <view class="as-detail-header">
          <text class="as-detail-title">售后详情</text>
          <text class="as-detail-close" @click="closeDetail">✕</text>
        </view>
        <scroll-view scroll-y class="as-detail-body" v-if="currentDetail">
          <!-- 商品信息 -->
          <view class="as-detail-goods" v-if="currentDetail.goods_snapshot">
            <image class="as-dg-thumb" :src="currentDetail.goods_snapshot.image" mode="aspectFill" @click="previewImages([currentDetail.goods_snapshot.image], 0)"></image>
            <view class="as-dg-info">
              <text class="as-dg-title">{{ currentDetail.goods_snapshot.title || '未知商品' }}</text>
              <text class="as-dg-sku" v-if="currentDetail.goods_snapshot.sku_name">{{ currentDetail.goods_snapshot.sku_name }}</text>
              <text class="as-dg-price">¥{{ formatMoney(currentDetail.goods_snapshot.price / 100) }} × {{ currentDetail.goods_snapshot.quantity || 1 }}</text>
            </view>
          </view>
          <view class="as-detail-row">
            <text class="as-dt-label">订单编号</text>
            <text class="as-dt-value">{{ currentDetail.order_id }}</text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.uid">
            <text class="as-dt-label">用户ID</text>
            <text class="as-dt-value as-dt-uid">{{ currentDetail.uid }}</text>
          </view>
          <view class="as-detail-row">
            <text class="as-dt-label">售后类型</text>
            <text class="as-dt-value">{{ currentDetail.refund_type === 'return_refund' ? '退货退款' : currentDetail.refund_type === 'exchange' ? '换货' : '仅退款' }}</text>
          </view>
          <view class="as-detail-row">
            <text class="as-dt-label">当前状态</text>
            <text :class="['as-status-badge', 'status-' + currentDetail.status]">{{ statusMap[currentDetail.status] || currentDetail.status }}</text>
          </view>
          <view class="as-detail-row">
            <text class="as-dt-label">退款金额</text>
            <text class="as-dt-value as-dt-amount">¥{{ formatMoney(currentDetail.refund_amount) }}</text>
          </view>
          <view class="as-detail-row">
            <text class="as-dt-label">申请原因</text>
            <text class="as-dt-value">{{ currentDetail.reason || '-' }}</text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.description">
            <text class="as-dt-label">补充描述</text>
            <text class="as-dt-value as-dt-desc">{{ currentDetail.description }}</text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.return_logistics_company">
            <text class="as-dt-label">退货物流</text>
            <text class="as-dt-value">{{ currentDetail.return_logistics_company }} / {{ currentDetail.return_logistics_no }}</text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.reject_reason">
            <text class="as-dt-label">拒绝原因</text>
            <text class="as-dt-value as-dt-reject">{{ currentDetail.reject_reason }}</text>
          </view>
          <view class="as-detail-row">
            <text class="as-dt-label">申请时间</text>
            <text class="as-dt-value">{{ formatTime(currentDetail.create_time) }}</text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.update_time">
            <text class="as-dt-label">更新时间</text>
            <text class="as-dt-value">{{ formatTime(currentDetail.update_time) }}</text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.refund_time">
            <text class="as-dt-label">退款时间</text>
            <text class="as-dt-value">{{ formatTime(currentDetail.refund_time) }}</text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.refund_result">
            <text class="as-dt-label">退款状态</text>
            <text :class="['as-dt-value', currentDetail.refund_result.success ? 'as-dt-refund-ok' : 'as-dt-refund-fail']">
              {{ currentDetail.refund_result.success ? '✅ 已原路退回' : '❌ 退款失败: ' + (currentDetail.refund_result.error || '未知错误') }}
            </text>
          </view>
          <view class="as-detail-row" v-if="currentDetail.refund_result && !currentDetail.refund_result.success" @click="showRefundLog(currentDetail.refund_result)">
            <text class="as-dt-label"></text>
            <text class="as-dt-value as-dt-link">查看退款接口详细日志 →</text>
          </view>
          <!-- 凭证图片 -->
          <view class="as-detail-row" v-if="currentDetail.images && currentDetail.images.length > 0">
            <text class="as-dt-label">凭证图片</text>
            <view class="as-img-list">
              <image v-for="(img, idx) in currentDetail.images" :key="idx" :src="img" class="as-detail-img" mode="aspectFill" @click="previewImages(currentDetail.images, idx)" />
            </view>
          </view>
        </scroll-view>
        <view class="as-detail-footer" v-if="currentDetail">
          <button v-if="currentDetail.status === 'pending' && currentDetail.refund_type !== 'return_refund'" class="as-btn as-btn-primary" @click="detailAgreeRefund">同意仅退款</button>
          <button v-if="currentDetail.status === 'pending' && currentDetail.refund_type === 'return_refund'" class="as-btn as-btn-primary" @click="detailAgreeReturn">同意退货</button>
          <button v-if="currentDetail.status === 'pending'" class="as-btn as-btn-danger" @click="detailReject">拒绝申请</button>
          <button v-if="currentDetail.status === 'returning_shipped'" class="as-btn as-btn-success" @click="detailConfirmReceived">确认收货并退款</button>
          <button class="as-btn as-btn-outline" @click="closeDetail">关闭</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const udb = ref(null)
const table = ref(null)
const detailPopup = ref(null)

const searchKey = ref('')
const activeTab = ref('all')
const pageSize = ref(15)
const pageCurrent = ref(1)
const currentDetail = ref(null)
const selectedIndexs = ref([])
const dataList = ref([])

const statusMap = {
  'pending': '待处理',
  'returning': '待买家寄回',
  'returning_shipped': '退货在途',
  'refunding': '退款处理中',
  'completed': '已完成',
  'rejected': '已拒绝'
}

const statsCards = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'returning', label: '待寄回' },
  { key: 'returning_shipped', label: '退货在途' },
  { key: 'completed', label: '已完成' },
  { key: 'rejected', label: '已拒绝' }
]

const statusFilterTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'returning', label: '待买家寄回' },
  { value: 'returning_shipped', label: '退货在途' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' }
]

const stats = reactive({
  all: 0,
  pending: 0,
  returning: 0,
  returning_shipped: 0,
  completed: 0,
  rejected: 0
})

const queryWhere = computed(() => {
  const conditions = []
  if (activeTab.value !== 'all') {
    conditions.push(`status == "${activeTab.value}"`)
  }
  if (searchKey.value.trim()) {
    conditions.push(`order_id == "${searchKey.value.trim()}"`)
  }
  return conditions.join(' && ')
})

// 加载统计数据
const loadStats = async () => {
  try {
    const db = uniCloud.database()
    const statuses = ['pending', 'returning', 'returning_shipped', 'completed', 'rejected']
    for (const s of statuses) {
      const { result } = await db.collection('after_sale_record').where({ status: s }).count()
      stats[s] = result?.total || 0
    }
    stats.all = Object.values(stats).reduce((a, b) => a + b, 0) - stats.all // all is sum
  } catch (e) { /* silent */ }
}

const switchTab = (val) => {
  activeTab.value = val
  pageCurrent.value = 1
  udb.value?.loadData()
}

const switchStatusFilter = (key) => {
  activeTab.value = key
  pageCurrent.value = 1
  udb.value?.loadData()
}

const doSearch = () => {
  pageCurrent.value = 1
  udb.value?.loadData()
}

const onPageChange = () => {
  udb.value?.loadData()
}

const formatMoney = (val) => {
  if (val === null || val === undefined) return '0.00'
  return Number(val).toFixed(2)
}

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const previewImages = (urls, idx) => {
  uni.previewImage({ urls, current: idx || 0 })
}

const showRefundLog = (refundResult) => {
  const logText = JSON.stringify(refundResult, null, 2)
  uni.showModal({
    title: '退款接口返回日志',
    content: logText.length > 1500 ? logText.substring(0, 1500) + '...' : logText,
    showCancel: false,
    confirmText: '关闭'
  })
}

const viewDetail = (item) => {
  currentDetail.value = item
  detailPopup.value?.open()
}

const closeDetail = () => {
  detailPopup.value?.close()
  currentDetail.value = null
}

// 操作处理
const onDataLoad = (data) => {
  dataList.value = data
}

const selectionChange = (e) => {
  selectedIndexs.value = e.detail.index
}

const delTable = () => {
  if (!selectedIndexs.value.length) {
    uni.showToast({ title: '请选择要删除的记录', icon: 'none' })
    return
  }

  // 获取真实的数据列表（通过 load 事件捕获的数据）
  const ids = selectedIndexs.value.map(i => dataList.value[i]._id)
  
  udb.value.remove(ids, {
    success: () => {
      selectedIndexs.value = []
      if (table.value) {
        table.value.clearSelection() // 清空表格勾选状态
      }
    }
  })
}

const callAfterSaleAction = async (action, item, extra = {}) => {
  uni.showLoading({ title: '处理中', mask: true })
  try {
    const res = await uniCloud.callFunction({
      name: 'order-api',
      data: {
        action,
        params: { afterSaleId: item._id, ...extra }
      }
    })
    if (res.result && res.result.errCode === 0) {
      uni.showToast({ title: '操作成功', icon: 'success' })
      closeDetail()
      udb.value?.refresh()
      loadStats()
    } else {
      uni.showToast({ title: res.result?.errMsg || '操作失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络异常', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// 修复缺失的商品快照
const isMigrating = ref(false)
const backfillSnapshots = async () => {
  uni.showModal({
    title: '修复商品快照',
    content: '将扫描所有缺少商品信息的售后记录，从关联订单中补全商品标题、图片、SKU等信息。继续？',
    success: async (r) => {
      if (!r.confirm) return
      isMigrating.value = true
      try {
        const res = await uniCloud.callFunction({
          name: 'order-api',
          data: { action: 'backfillGoodsSnapshots', params: {} }
        })
        if (res.result && res.result.errCode === 0) {
          uni.showToast({ title: res.result.errMsg, icon: 'success' })
          udb.value?.refresh()
          loadStats()
        } else {
          uni.showToast({ title: res.result?.errMsg || '修复失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '网络异常', icon: 'none' })
      } finally {
        isMigrating.value = false
      }
    }
  })
}

const handleAgreeRefund = (item) => {
  uni.showModal({
    title: '确认操作',
    content: `确定同意订单 ${item.order_id} 的仅退款申请？退款金额 ¥${formatMoney(item.refund_amount)}`,
    success: (r) => { if (r.confirm) callAfterSaleAction('mockAdminAgreeRefund', item) }
  })
}

const handleAgreeReturn = (item) => {
  uni.showModal({
    title: '确认操作',
    content: `确定同意订单 ${item.order_id} 的退货退款申请？商家同意后等待买家寄回商品。`,
    success: (r) => { if (r.confirm) callAfterSaleAction('mockAdminAgreeReturn', item) }
  })
}

const handleReject = (item) => {
  uni.showModal({
    title: '拒绝售后',
    content: `确定拒绝订单 ${item.order_id} 的售后申请？`,
    editable: true,
    placeholderText: '请输入拒绝原因（选填）',
    success: (r) => {
      if (r.confirm) {
        callAfterSaleAction('rejectAfterSale', item, { rejectReason: r.content || '' })
      }
    }
  })
}

const handleConfirmReceived = (item) => {
  uni.showModal({
    title: '确认收货退款',
    content: `确定已收到订单 ${item.order_id} 的退货商品并执行退款？物流：${item.return_logistics_company || '-'} / ${item.return_logistics_no || '-'}`,
    success: (r) => { if (r.confirm) callAfterSaleAction('mockAdminConfirmReturnAndRefund', item) }
  })
}

const detailAgreeRefund = () => {
  if (currentDetail.value) handleAgreeRefund(currentDetail.value)
}

const detailAgreeReturn = () => {
  if (currentDetail.value) handleAgreeReturn(currentDetail.value)
}

const detailReject = () => {
  if (currentDetail.value) handleReject(currentDetail.value)
}

const detailConfirmReceived = () => {
  if (currentDetail.value) handleConfirmReceived(currentDetail.value)
}

// 初始化加载统计数据
loadStats()
</script>

<style lang="scss" scoped>
// 主色调
$primary: #a08064;
$primary-light: #c4a882;
$primary-dark: #7a5d3e;
$bg: #f8f6f3;
$card-bg: #fff;
$text: #3d3226;
$text-light: #8a7b6b;
$danger: #c0392b;
$danger-light: #fdf0ef;
$success: #5d8c5a;
$success-light: #edf7ed;
$warning: #c9893c;
$warning-light: #fef8f0;
$border: #e8e2d9;

.as-container {
  padding: 20px;
  background: $bg;
  min-height: 100vh;
}

// 统计卡片
.as-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.as-stat-item {
  flex: 1;
  min-width: 120px;
  background: $card-bg;
  border-radius: 10px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    border-color: $primary-light;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(160, 128, 100, 0.15);
  }

  .stat-num {
    font-size: 32px;
    font-weight: 700;
    color: $text;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: $text-light;
    margin-top: 6px;
  }
}

.stat-pending .stat-num { color: #c0392b; }
.stat-returning .stat-num, .stat-returning_shipped .stat-num { color: #c9893c; }
.stat-completed .stat-num { color: #5d8c5a; }
.stat-rejected .stat-num { color: #999; }

// 搜索筛选栏
.as-header {
  background: $card-bg;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.as-search-wrap {
  flex: 0 0 260px;
}

.as-search {
  width: 100%;
  height: 36px;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 14px;
  background: $bg;
  color: $text;

  &:focus { border-color: $primary; }
}

.as-filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.as-tab {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: $text-light;
  background: $bg;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover { color: $primary; }
}

.as-tab-active {
  background: $primary;
  color: #fff !important;
}

.as-btn-migrate {
  margin-left: auto;
  background: #fff;
  color: $primary;
  border: 1px dashed $primary-light;
  border-radius: 6px;
  font-size: 12px;
  padding: 4px 14px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #faf7f3; border-style: solid; }
}

// 表格区域
.as-error, .as-loading {
  text-align: center;
  padding: 60px 20px;
  color: $text-light;
  font-size: 15px;
  background: $card-bg;
  border-radius: 10px;
}

// 商品信息单元格
.as-goods-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.as-goods-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: #f0ede8;
  flex-shrink: 0;
  cursor: pointer;
}

.as-goods-name {
  font-size: 13px;
  color: $text;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.as-goods-sku {
  font-size: 11px;
  color: $primary;
  background: #f8f3ed;
  padding: 1px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}

.as-goods-text {
  flex: 1;
  min-width: 0;
}

.as-order-id {
  color: $primary;
  cursor: pointer;
  text-decoration: underline;
  &:hover { color: $primary-dark; }
}

.as-type-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.type-refund {
  background: #fef0e6;
  color: #c9893c;
}

.type-return {
  background: #eaf0fb;
  color: #4a72c9;
}

.as-amount {
  font-weight: 700;
  color: $primary;
  font-size: 14px;
}

.as-reason {
  font-size: 13px;
  color: $text-light;
}

.as-status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending { background: #fdeaea; color: #c0392b; }
.status-returning { background: #fef8f0; color: #c9893c; }
.status-returning_shipped { background: #eaf0fb; color: #4a72c9; }
.status-refunding { background: #fef8f0; color: #c9893c; }
.status-completed { background: #edf7ed; color: #5d8c5a; }
.status-rejected { background: #f5f5f5; color: #999; }

// 操作按钮
.as-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.as-btn {
  height: 28px;
  line-height: 28px;
  font-size: 12px;
  padding: 0 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:active { opacity: 0.8; }
}

.as-btn-primary {
  background: $primary;
  color: #fff;
  &:hover { background: $primary-dark; }
}

.as-btn-danger {
  background: #fff;
  color: $danger;
  border: 1px solid $danger;
  &:hover { background: $danger-light; }
}

.as-btn-success {
  background: $success;
  color: #fff;
  &:hover { background: darken($success, 8%); }
}

.as-btn-outline {
  background: #fff;
  color: $primary;
  border: 1px solid $border;
  &:hover { border-color: $primary; }
}

// 分页
.as-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

// 详情弹窗
.as-detail-card {
  width: 620px;
  max-height: 80vh;
  background: $card-bg;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.as-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid $border;
  background: $bg;
}

.as-detail-title {
  font-size: 17px;
  font-weight: 700;
  color: $text;
}

.as-detail-close {
  font-size: 20px;
  color: $text-light;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover { background: #eee; }
}

.as-detail-body {
  padding: 20px 24px;
  max-height: 50vh;
}

// 详情中的商品信息
.as-detail-goods {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: $bg;
  border-radius: 10px;
  margin-bottom: 18px;
}

.as-dg-thumb {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  background: #e8e4dd;
  flex-shrink: 0;
  cursor: pointer;
}

.as-dg-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .as-dg-title {
    font-size: 15px;
    font-weight: 600;
    color: $text;
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .as-dg-sku {
    font-size: 12px;
    color: $primary;
    background: #f8f3ed;
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    margin-bottom: 6px;
    align-self: flex-start;
  }

  .as-dg-price {
    font-size: 14px;
    color: $primary;
    font-weight: 600;
  }
}

.as-detail-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f5f2ed;

  &:last-child { border-bottom: none; }
}

.as-dt-label {
  width: 80px;
  flex-shrink: 0;
  font-size: 14px;
  color: $text-light;
}

.as-dt-value {
  flex: 1;
  font-size: 14px;
  color: $text;
  word-break: break-all;
}

.as-dt-amount {
  font-size: 18px;
  font-weight: 700;
  color: $primary;
}

.as-dt-desc {
  line-height: 1.6;
  background: $bg;
  padding: 10px 14px;
  border-radius: 8px;
}

.as-dt-reject {
  color: $danger;
}

.as-dt-refund-ok {
  color: $success;
  font-weight: 600;
}

.as-dt-refund-fail {
  color: $danger;
  font-weight: 600;
}

.as-dt-link {
  color: $primary;
  cursor: pointer;
  text-decoration: underline;
  font-size: 13px;
}

.as-img-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.as-detail-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: #eee;
  cursor: pointer;
}

.as-detail-footer {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid $border;
  justify-content: flex-end;
  background: $bg;
}
</style>
