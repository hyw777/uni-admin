<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title"></view>
        <view class="uni-sub-title"></view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="doSearch" placeholder="搜索核销码/订单号" />
        <button class="uni-button" type="default" size="mini" @click="doSearch">搜索</button>
        <button class="uni-button" type="default" size="mini" @click="switchStatusFilter(null)">全部</button>
        <button class="uni-button" type="primary" size="mini" @click="goToStatistics">统计面板</button>
      </view>
    </view>

    <view class="status-filter-bar">
      <view v-for="s in statusFilterOptions" :key="s.value"
        :class="['sfb-item', currentStatus === s.value ? 'sfb-active' : '']"
        @click="switchStatusFilter(s.value)">{{ s.text }}</view>
    </view>

    <view class="stat-cards">
      <view class="stat-card">
        <view class="stat-value">{{ statOverview.total }}</view>
        <view class="stat-label">核销码总数</view>
      </view>
      <view class="stat-card stat-card-green">
        <view class="stat-value">{{ statOverview.used }}</view>
        <view class="stat-label">已核销</view>
      </view>
      <view class="stat-card stat-card-orange">
        <view class="stat-value">{{ statOverview.valid }}</view>
        <view class="stat-label">待核销</view>
      </view>
      <view class="stat-card">
        <view class="stat-value">{{ statOverview.used_rate }}%</view>
        <view class="stat-label">核销率</view>
      </view>
    </view>

    <view class="uni-container">
      <uni-table ref="table" :loading="loading" :emptyText="loading ? '加载中...' : '暂无数据'" border stripe>
        <uni-tr>
          <uni-th align="center">核销码</uni-th>
          <uni-th align="center">关联订单</uni-th>
          <uni-th align="center">用户信息</uni-th>
          <uni-th align="center">门店</uni-th>
          <uni-th align="center">状态</uni-th>
          <uni-th align="center">创建时间</uni-th>
          <uni-th align="center">核销时间</uni-th>
          <uni-th align="center">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item,index) in listData" :key="index">
          <uni-td align="center">
            <text class="code-text" @click="copyCode(item.code)">{{ formatCode(item.code) }}</text>
          </uni-td>
          <uni-td align="center">
            <view class="order-info">
              <text class="order-no">{{ item.order_no || '-' }}</text>
              <text class="goods-name">{{ item.goods_title || '-' }}</text>
              <text class="order-fee">¥{{ item.order_total_fee ? (item.order_total_fee / 100).toFixed(2) : '0.00' }}</text>
            </view>
          </uni-td>
          <uni-td align="center">
            <view class="user-cell">
              <text>{{ item.user_nickname || '-' }}</text>
              <text class="mobile-text">{{ item.user_mobile || '' }}</text>
            </view>
          </uni-td>
          <uni-td align="center"><text>{{ item.store_name || item.store_id || '-' }}</text></uni-td>
          <uni-td align="center">
            <view :class="['status-badge', 'status-' + item.status]">{{ statusText(item.status) }}</view>
          </uni-td>
          <uni-td align="center">
            <uni-dateformat :threshold="[0,0]" :date="item.create_date" format="yyyy-MM-dd HH:mm"></uni-dateformat>
          </uni-td>
          <uni-td align="center">
            <view v-if="item.used_time">
              <uni-dateformat :threshold="[0,0]" :date="item.used_time" format="yyyy-MM-dd HH:mm"></uni-dateformat>
              <text class="used-by">{{ item.used_by_nickname }}</text>
            </view>
            <text v-else>-</text>
          </uni-td>
          <uni-td align="center">
            <button @click="showDetail(item)" class="uni-button" size="mini" type="default">详情</button>
          </uni-td>
        </uni-tr>
      </uni-table>

      <view class="pagination-bar">
        <view class="page-info">共 {{ total }} 条</view>
        <view class="page-btns">
          <button class="page-btn" :disabled="page <= 1" @click="prevPage">上一页</button>
          <text class="page-num">{{ page }} / {{ totalPages }}</text>
          <button class="page-btn" :disabled="page >= totalPages" @click="nextPage">下一页</button>
        </view>
      </view>
    </view>

    <!-- 详情弹窗 -->
    <uni-popup ref="detailPopup" type="center">
      <view class="detail-popup" v-if="detailData">
        <view class="popup-header">
          <text class="popup-title">核销码详情</text>
          <text class="popup-close" @click="closeDetail">×</text>
        </view>
        <view class="popup-body">
          <view class="popup-row">
            <text class="popup-label">核销码</text>
            <text class="popup-value code-large">{{ formatCode(detailData.code) }}</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">状态</text>
            <view :class="['status-badge', 'status-' + detailData.status]">{{ statusText(detailData.status) }}</view>
          </view>
          <view class="popup-row">
            <text class="popup-label">核销门店</text>
            <text class="popup-value">{{ detailData.store_name || '-' }}</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">关联订单</text>
            <text class="popup-value">{{ detailData.order_no || '-' }}</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">下单用户</text>
            <text class="popup-value">{{ detailData.userInfo && detailData.userInfo.nickname ? detailData.userInfo.nickname : '-' }}</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">用户手机</text>
            <text class="popup-value">{{ detailData.userInfo && detailData.userInfo.mobile ? detailData.userInfo.mobile : '-' }}</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">创建时间</text>
            <text class="popup-value">{{ formatDate(detailData.create_date) }}</text>
          </view>
          <view class="popup-row" v-if="detailData.used_time">
            <text class="popup-label">核销时间</text>
            <text class="popup-value">{{ formatDate(detailData.used_time) }}</text>
          </view>
          <view class="popup-row" v-if="detailData.usedByInfo && detailData.usedByInfo.nickname">
            <text class="popup-label">核销人</text>
            <text class="popup-value">{{ detailData.usedByInfo.nickname || '-' }}</text>
          </view>
          <view class="popup-row" v-if="detailData.valid_end_time">
            <text class="popup-label">有效期至</text>
            <text class="popup-value">{{ formatDate(detailData.valid_end_time) }}</text>
          </view>
          <view class="popup-row" v-if="detailData.expired_reason">
            <text class="popup-label">作废原因</text>
            <text class="popup-value error-text">{{ detailData.expired_reason }}</text>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 延期弹窗 -->
    <uni-popup ref="extendPopup" type="center">
      <view class="action-popup" v-if="extendTarget">
        <view class="popup-header">
          <text class="popup-title">延长有效期</text>
          <text class="popup-close" @click="closeExtend">×</text>
        </view>
        <view class="popup-body">
          <view class="popup-row">
            <text class="popup-label">有效期至</text>
            <text class="popup-value">{{ detailData && detailData._id === extendTarget._id ? formatDate(detailData.valid_end_time) : '未设置' }}</text>
          </view>
          <view class="extend-form">
            <text class="form-label">延长天数</text>
            <view class="day-options">
              <view v-for="d in [7, 15, 30]" :key="d"
                :class="['day-btn', extendDays === d ? 'day-btn-active' : '']"
                @click="extendDays = d">+{{ d }}天</view>
            </view>
            <view class="custom-days">
              <input class="uni-input" type="number" v-model="customDays" placeholder="或输入自定义天数" />
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <button type="primary" class="confirm-btn" @click="doExtend">确认延期</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  data() {
    return {
      listData: [],
      total: 0,
      page: 1,
      pageSize: 20,
      query: '',
      currentStatus: null,
      loading: false,
      statOverview: { total: 0, used: 0, valid: 0, unused: 0, used_rate: '0.0' },
      statusFilterOptions: [
        { text: '全部', value: null },
        { text: '待核销', value: 'valid' },
        { text: '已核销', value: 'used' },
        { text: '已作废', value: 'expired' }
      ],
      detailData: null,
      extendTarget: null,
      extendDays: 7,
      customDays: ''
    }
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    }
  },
  onLoad() {
    this.loadStatistics()
    this.loadList()
  },
  methods: {
    loadList(clearPage) {
      if (clearPage) this.page = 1
      this.loading = true
      uniCloud.callFunction({
        name: 'admin-redemption-api',
        data: {
          action: 'list',
          params: {
            status: this.currentStatus,
            keyword: this.query || undefined,
            page: this.page,
            pageSize: this.pageSize
          }
        }
      }).then(res => {
        if (res.result && res.result.errCode === 0) {
          const d = res.result.data
          this.listData = d.list || []
          this.total = d.total || 0
        } else {
          uni.showToast({ title: res.result && res.result.errMsg ? res.result.errMsg : '加载失败', icon: 'none' })
        }
      }).catch(() => {
        uni.showToast({ title: '网络异常', icon: 'none' })
      }).finally(() => {
        this.loading = false
      })
    },
    loadStatistics() {
      uniCloud.callFunction({
        name: 'admin-redemption-api',
        data: { action: 'statistics' }
      }).then(res => {
        if (res.result && res.result.errCode === 0) {
          const o = res.result.data.overview
          this.statOverview = {
            total: o.total,
            used: o.used,
            valid: o.valid,
            unused: o.unused,
            used_rate: o.used_rate
          }
        }
      }).catch(() => {})
    },
    switchStatusFilter(val) {
      this.currentStatus = val
      this.loadList(true)
      this.loadStatistics()
    },
    doSearch() {
      this.page = 1
      this.loadList()
    },
    prevPage() {
      if (this.page > 1) {
        this.page--
        this.loadList()
      }
    },
    nextPage() {
      if (this.page < this.totalPages) {
        this.page++
        this.loadList()
      }
    },
    statusText(status) {
      const map = { unused: '未激活', valid: '待核销', used: '已核销', expired: '已作废' }
      return map[status] || status
    },
    formatCode(code) {
      if (!code) return ''
      return code.replace(/(.{4})/g, '$1 ').trim()
    },
    formatDate(ts) {
      if (!ts) return '-'
      const d = new Date(ts)
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
    },
    copyCode(code) {
      uni.setClipboardData({ data: code })
      uni.showToast({ title: '已复制', icon: 'none' })
    },
    showDetail(item) {
      uni.showLoading({ mask: true })
      uniCloud.callFunction({
        name: 'admin-redemption-api',
        data: { action: 'detail', params: { id: item._id } }
      }).then(res => {
        if (res.result && res.result.errCode === 0) {
          this.detailData = res.result.data
          this.$refs.detailPopup.open()
        } else {
          uni.showToast({ title: res.result && res.result.errMsg ? res.result.errMsg : '获取失败', icon: 'none' })
        }
      }).catch(() => {
        uni.showToast({ title: '网络异常', icon: 'none' })
      }).finally(() => {
        uni.hideLoading()
      })
    },
    closeDetail() {
      this.$refs.detailPopup.close()
    },
    showInvalidateDialog(item) {
      uni.showModal({
        title: '确认作废',
        content: '确定作废核销码 ' + this.formatCode(item.code) + ' 吗？作废后无法恢复。',
        success: (res) => {
          if (!res.confirm) return
          uni.showLoading({ mask: true })
          uniCloud.callFunction({
            name: 'admin-redemption-api',
            data: { action: 'invalidate', params: { id: item._id } }
          }).then(r => {
            if (r.result && r.result.errCode === 0) {
              uni.showToast({ title: '已作废', icon: 'success' })
              this.loadList()
              this.loadStatistics()
            } else {
              uni.showToast({ title: r.result && r.result.errMsg ? r.result.errMsg : '操作失败', icon: 'none' })
            }
          }).catch(() => {
            uni.showToast({ title: '网络异常', icon: 'none' })
          }).finally(() => {
            uni.hideLoading()
          })
        }
      })
    },
    showExtendDialog(item) {
      this.extendTarget = item
      this.extendDays = 7
      this.customDays = ''
      this.detailData = null
      uniCloud.callFunction({
        name: 'admin-redemption-api',
        data: { action: 'detail', params: { id: item._id } }
      }).then(res => {
        if (res.result && res.result.errCode === 0) {
          this.detailData = res.result.data
        }
      }).catch(() => {})
      this.$refs.extendPopup.open()
    },
    closeExtend() {
      this.$refs.extendPopup.close()
    },
    doExtend() {
      var days = this.customDays ? parseInt(this.customDays) : this.extendDays
      if (!days || days < 1) {
        uni.showToast({ title: '请输入有效的天数', icon: 'none' })
        return
      }
      uni.showLoading({ mask: true })
      uniCloud.callFunction({
        name: 'admin-redemption-api',
        data: { action: 'extend', params: { id: this.extendTarget._id, days: days } }
      }).then(res => {
        if (res.result && res.result.errCode === 0) {
          uni.showToast({ title: '延期成功', icon: 'success' })
          this.closeExtend()
          this.loadList()
        } else {
          uni.showToast({ title: res.result && res.result.errMsg ? res.result.errMsg : '操作失败', icon: 'none' })
        }
      }).catch(() => {
        uni.showToast({ title: '网络异常', icon: 'none' })
      }).finally(() => {
        uni.hideLoading()
      })
    },
    forceVerify(item) {
      uni.showModal({
        title: '强制核销',
        content: '确定强制核销此核销码吗？此操作将绕过门店限制。',
        success: (res) => {
          if (!res.confirm) return
          uni.showLoading({ mask: true })
          uniCloud.callFunction({
            name: 'admin-redemption-api',
            data: { action: 'forceVerify', params: { id: item._id } }
          }).then(r => {
            if (r.result && r.result.errCode === 0) {
              uni.showToast({ title: '核销成功', icon: 'success' })
              this.loadList()
              this.loadStatistics()
            } else {
              uni.showToast({ title: r.result && r.result.errMsg ? r.result.errMsg : '操作失败', icon: 'none' })
            }
          }).catch(() => {
            uni.showToast({ title: '网络异常', icon: 'none' })
          }).finally(() => {
            uni.hideLoading()
          })
        }
      })
    },
    goToStatistics() {
      uni.navigateTo({ url: '/pages/redemption/statistics' })
    }
  }
}
</script>

<style scoped>
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
  padding: 4px 14px;
  border-radius: 16px;
  font-size: 13px;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.sfb-active { background: #1890ff; color: #fff; border-color: #1890ff; }
.stat-cards {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.stat-card {
  flex: 1;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
}
.stat-card-green { background: #f6ffed; }
.stat-card-orange { background: #fff7e6; }
.stat-value { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 2px; }
.stat-card-green .stat-value { color: #52c41a; }
.stat-card-orange .stat-value { color: #fa8c16; }
.stat-label { font-size: 11px; color: #999; }
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 18px;
}
.status-unused { background: #f0f0f0; color: #999; }
.status-valid { background: #e6f7ff; color: #1890ff; }
.status-used { background: #f6ffed; color: #52c41a; }
.status-expired { background: #fff1f0; color: #ff4d4f; }
.code-text {
  font-family: monospace;
  font-size: 13px;
  color: #1890ff;
  cursor: pointer;
  letter-spacing: 1px;
}
.order-info { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.order-no { font-size: 12px; color: #333; font-weight: 500; }
.goods-name { font-size: 11px; color: #666; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-fee { font-size: 12px; color: #ff4d4f; font-weight: bold; }
.user-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.mobile-text { font-size: 11px; color: #999; }
.used-by { font-size: 11px; color: #52c41a; display: block; }
.op-btns { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}
.page-info { font-size: 13px; color: #999; }
.page-btns { display: flex; align-items: center; gap: 10px; }
.page-btn {
  padding: 4px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  color: #666;
}
.page-btn[disabled] { color: #d9d9d9; border-color: #d9d9d9; }
.page-num { font-size: 13px; color: #333; }
.detail-popup, .action-popup {
  background: #fff;
  border-radius: 12px;
  width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}
.popup-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.popup-title { font-size: 16px; font-weight: bold; color: #333; flex: 1; }
.popup-close { font-size: 22px; color: #999; cursor: pointer; }
.popup-body { padding: 12px 16px; }
.popup-footer { padding: 12px 16px; border-top: 1px solid #f0f0f0; }
.popup-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}
.popup-row:last-child { border-bottom: none; }
.popup-label { width: 90px; color: #999; font-size: 13px; flex-shrink: 0; }
.popup-value { flex: 1; font-size: 13px; color: #333; word-break: break-all; }
.code-large { font-size: 16px; font-family: monospace; color: #1890ff; font-weight: bold; }
.error-text { color: #ff4d4f; }
.confirm-btn { background: #1890ff; color: #fff; border: none; border-radius: 6px; font-size: 14px; height: 40px; line-height: 40px; width: 100%; }
.extend-form { padding-top: 12px; }
.form-label { font-size: 13px; color: #666; margin-bottom: 10px; display: block; }
.day-options { display: flex; gap: 10px; margin-bottom: 10px; }
.day-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  background: #fff;
}
.day-btn-active { border-color: #1890ff; color: #1890ff; background: #e6f7ff; }
.custom-days .uni-input {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}
</style>
