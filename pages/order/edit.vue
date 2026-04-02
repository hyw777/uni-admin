<template>
  <view class="uni-container">
    <!-- 订单基本信息 -->
    <view class="order-detail-section">
      <view class="section-title">订单信息</view>
      <view class="detail-row">
        <text class="detail-label">订单ID</text>
        <text class="detail-value">{{ formData._id }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">订单类型</text>
        <text class="detail-value">{{ orderTypeText(formData.order_type) }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">订单状态</text>
        <view :class="['status-badge', 'status-' + formData.status]">{{ statusText(formData.status) }}</view>
      </view>
      <view class="detail-row">
        <text class="detail-label">下单时间</text>
        <text class="detail-value">
          <uni-dateformat v-if="formData.create_date" :date="formData.create_date" format="yyyy-MM-dd HH:mm:ss"></uni-dateformat>
          <text v-else>-</text>
        </text>
      </view>
    </view>

    <!-- 商品明细 -->
    <view class="order-detail-section">
      <view class="section-title">商品明细</view>
      <view v-if="formData.items && formData.items.length" class="goods-list">
        <view v-for="(goods, idx) in formData.items" :key="idx" class="goods-item">
          <image v-if="goods.image" :src="goods.image" class="goods-thumb" mode="aspectFill"></image>
          <view v-else class="goods-thumb goods-thumb-placeholder">无图</view>
          <view class="goods-info">
            <text class="goods-title">{{ goods.title || '商品' + (idx + 1) }}</text>
            <text class="goods-sub">x{{ goods.quantity }} &nbsp; 单价 {{ (goods.price / 100).toFixed(2) }} 元</text>
          </view>
          <text class="goods-price">¥{{ ((goods.price * goods.quantity) / 100).toFixed(2) }}</text>
        </view>
      </view>
      <view class="detail-row total-row">
        <text class="detail-label">实付金额</text>
        <text class="total-price">¥{{ formData.total_fee ? (formData.total_fee / 100).toFixed(2) : '0.00' }}</text>
      </view>
    </view>

    <!-- 收货/核销信息 -->
    <view class="order-detail-section">
      <view class="section-title">{{ formData.address && formData.address.name ? '收货信息' : '核销信息' }}</view>
      <view v-if="formData.address && formData.address.name">
        <view class="detail-row">
          <text class="detail-label">收货人</text>
          <text class="detail-value">{{ formData.address.name }} {{ formData.address.mobile }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">收货地址</text>
          <text class="detail-value address-value">{{ formatAddress(formData.address) }}</text>
        </view>
      </view>
      <view v-else-if="formData.redemption_store_name">
        <view class="detail-row">
          <text class="detail-label">核销门店</text>
          <text class="detail-value">{{ formData.redemption_store_name }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">门店地址</text>
          <text class="detail-value address-value">{{ formData.redemption_store_address }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">门店电话</text>
          <text class="detail-value">{{ formData.redemption_store_mobile }}</text>
        </view>
      </view>
      <view v-else>
        <text class="detail-value">暂无地址信息</text>
      </view>
    </view>

    <!-- 发货表单（仅待发货状态可编辑） -->
    <view v-if="formData.status === 1" class="order-detail-section">
      <view class="section-title">发货信息</view>
      <view class="ship-inline-field">
        <text class="ship-inline-label">配送方式</text>
        <view class="option-list">
          <view
            v-for="opt in deliveryMethodOptions"
            :key="opt.value"
            :class="['option-item', shipData.delivery_method === opt.value ? 'option-item-active' : '']"
            @click="shipData.delivery_method = opt.value"
          >{{ opt.text }}</view>
        </view>
      </view>
      <view class="ship-inline-field">
        <text class="ship-inline-label">快递公司</text>
        <view class="option-grid">
          <view
            v-for="opt in logisticsCompanyOptions"
            :key="opt.value"
            :class="['option-item', shipData.logistics_company === opt.value ? 'option-item-active' : '']"
            @click="shipData.logistics_company = opt.value"
          >{{ opt.text }}</view>
        </view>
      </view>
      <view class="ship-inline-field">
        <text class="ship-inline-label">快递单号</text>
        <uni-easyinput v-model="shipData.logistics_no" placeholder="请填写快递单号" />
      </view>
    </view>

    <!-- 已发货信息（只读展示） -->
    <view v-else-if="formData.status === 2" class="order-detail-section">
      <view class="section-title">发货信息</view>
      <view class="detail-row">
        <text class="detail-label">配送方式</text>
        <text class="detail-value">{{ deliveryMethodText(formData.delivery_method) }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">快递公司</text>
        <text class="detail-value">{{ formData.logistics_company || '-' }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">快递单号</text>
        <text class="detail-value logistics-no">{{ formData.logistics_no || '-' }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="order-detail-section">
      <view class="btn-group">
        <button v-if="formData.status === 1" type="primary" class="uni-button" style="width: 200px;" @click="submitShip">确认发货</button>
        <navigator open-type="navigateBack">
          <button class="uni-button" style="width: 100px; margin-left: 15px;">返回</button>
        </navigator>
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
const dbCollectionName = 'order'

export default {
  data() {
    return {
      formData: {
        _id: '',
        order_type: '',
        total_fee: 0,
        status: 0,
        items: [],
        address: null,
        redemption_store_name: '',
        redemption_store_address: '',
        redemption_store_mobile: '',
        delivery_method: null,
        logistics_company: '',
        logistics_no: '',
        create_date: null
      },
      shipData: {
        delivery_method: 1,
        delivery_method_text: '快递',
        logistics_company: '',
        logistics_no: ''
      },
      deliveryMethodOptions: [
        { text: '快递', value: 1 },
        { text: '大件物流', value: 2 },
        { text: '送货入户带安装', value: 3 },
        { text: '同城车队', value: 4 }
      ],
      logisticsCompanyOptions: [
        { text: '顺丰速运', value: '顺丰速运' },
        { text: '圆通速递', value: '圆通速递' },
        { text: '中通快递', value: '中通快递' },
        { text: '韵达快递', value: '韵达快递' },
        { text: '申通快递', value: '申通快递' },
        { text: '极兔速递', value: '极兔速递' },
        { text: '京东物流', value: '京东物流' },
        { text: '德邦快递', value: '德邦快递' },
        { text: '邮政EMS', value: '邮政EMS' },
        { text: '邮政小包', value: '邮政小包' },
        { text: '其他', value: '其他' }
      ]
    }
  },
  computed: {
    logisticsCompanyIndex() {
      const idx = this.logisticsCompanyOptions.findIndex(o => o.value === this.shipData.logistics_company)
      return idx >= 0 ? idx : 0
    }
  },
  onLoad(e) {
    if (e.id) {
      this.formDataId = e.id
      this.getDetail(e.id)
    }
  },
  methods: {
    getDetail(id) {
      uni.showLoading({ mask: true })
      db.collection(dbCollectionName).doc(id).field(
        'order_type,items,total_fee,status,address,redemption_store_name,redemption_store_address,redemption_store_mobile,delivery_method,logistics_company,logistics_no,create_date'
      ).get().then(res => {
        const data = res.result.data[0]
        if (data) {
          this.formData = data
          // 发货表单默认值
          this.shipData.delivery_method = data.delivery_method || 1
          this.shipData.delivery_method_text = this.deliveryMethodText(data.delivery_method) || '快递'
          this.shipData.logistics_company = data.logistics_company || ''
          this.shipData.logistics_no = data.logistics_no || ''
        }
      }).catch(err => {
        uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
      }).finally(() => {
        uni.hideLoading()
      })
    },
    onLogisticsCompanyChange(idx) {
      this.shipData.logistics_company = this.logisticsCompanyOptions[idx].value
    },
    submitShip() {
      if (!this.shipData.logistics_company.trim()) {
        uni.showToast({ title: '请选择快递公司', icon: 'none' })
        return
      }
      if (!this.shipData.logistics_no.trim()) {
        uni.showToast({ title: '请填写快递单号', icon: 'none' })
        return
      }
      uni.showLoading({ mask: true })
      db.collection(dbCollectionName).doc(this.formDataId).update({
        status: 2,
        delivery_method: this.shipData.delivery_method,
        logistics_company: this.shipData.logistics_company,
        logistics_no: this.shipData.logistics_no.trim()
      }).then(res => {
        uni.showToast({ title: '发货成功' })
        setTimeout(() => uni.navigateBack(), 800)
      }).catch(err => {
        uni.showModal({ title: '发货失败', content: err.message, showCancel: false })
      }).finally(() => {
        uni.hideLoading()
      })
    },

    // ── 文本映射 ──────────────────────────────────
    statusText(status) {
      const map = { 0: '待支付', 1: '待发货', 2: '已发货', 3: '已完成', '-1': '已取消' }
      return map[status] ?? status
    },
    orderTypeText(v) {
      const map = { normal: '普通商品', group_online: '线上团购', group_offline: '线下体验/代金券' }
      return map[v] ?? v
    },
    deliveryMethodText(v) {
      const map = { 1: '快递', 2: '大件物流', 3: '送货入户带安装', 4: '同城车队' }
      return map[v] ?? '-'
    },
    formatAddress(addr) {
      if (!addr) return '-'
      const parts = [addr.province, addr.city, addr.district, addr.address].filter(Boolean)
      return parts.join('')
    }
  }
}
</script>

<style scoped>
.order-detail-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}
.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}
.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  width: 80px;
  color: #999;
  font-size: 13px;
  flex-shrink: 0;
}
.detail-value {
  flex: 1;
  font-size: 13px;
  color: #333;
  word-break: break-all;
}
.address-value {
  line-height: 1.5;
}
.total-row {
  border-bottom: none;
}
.total-price {
  color: #ff4d4f;
  font-size: 16px;
  font-weight: bold;
}

/* 商品明细 */
.goods-list {
  margin-bottom: 8px;
}
.goods-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}
.goods-item:last-child {
  border-bottom: none;
}
.goods-thumb {
  width: 48px;
  height: 48px;
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
  flex: 1;
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.goods-title {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-sub {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.goods-price {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  margin-left: 10px;
  flex-shrink: 0;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 18px;
}
.status-0 { background: #fff7e6; color: #fa8c16; }
.status-1 { background: #e6f7ff; color: #1890ff; }
.status-2 { background: #f6ffed; color: #52c41a; }
.status-3 { background: #f0f0f0; color: #8c8c8c; }
.status---1 { background: #fff1f0; color: #ff4d4f; }

/* 发货表单（内嵌） */
.ship-inline-field {
  margin-bottom: 14px;
}
.ship-inline-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
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

.logistics-no {
  font-family: monospace;
  color: #1890ff;
  font-size: 13px;
}

/* 按钮 */
.btn-group {
  display: flex;
  align-items: center;
}
</style>
