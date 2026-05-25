<template>
  <view class="dashboard-page">
    <!-- 时间筛选 -->
    <view class="filter-bar">
      <view
        v-for="r in rangeOptions"
        :key="r.value"
        :class="['range-btn', currentRange === r.value ? 'range-btn-active' : '']"
        @click="switchRange(r.value)"
      >{{ r.text }}</view>
      <view class="range-btn" @click="showDatePicker = true">
        {{ dateRangeLabel }}
        <text class="arrow-down">▼</text>
      </view>
    </view>

    <!-- 顶部汇总指标卡片 -->
    <view class="summary-cards">
      <view class="summary-card">
        <view class="sum-icon sum-icon-orders">📦</view>
        <view class="sum-info">
          <view class="sum-value">{{ summary.paid_orders }}</view>
          <view class="sum-label">有效订单</view>
          <view class="sum-compare">共 {{ summary.total_orders }} 单</view>
        </view>
      </view>
      <view class="summary-card">
        <view class="sum-icon sum-icon-amount">💰</view>
        <view class="sum-info">
          <view class="sum-value">{{ formatAmount(summary.paid_amount) }}</view>
          <view class="sum-label">实收金额</view>
          <view class="sum-compare">均价 {{ formatAmount(summary.avg_order_value) }}</view>
        </view>
      </view>
      <view class="summary-card summary-card-today">
        <view class="sum-icon sum-icon-today">📅</view>
        <view class="sum-info">
          <view class="sum-value">{{ todayStats.orders }}</view>
          <view class="sum-label">今日订单</view>
          <view class="sum-compare">¥{{ formatAmount(todayStats.amount) }}</view>
        </view>
      </view>
    </view>

    <!-- 订单类型分布 -->
    <view class="dash-section">
      <view class="section-title">订单类型分布</view>
      <view class="type-dist-grid">
        <view
          v-for="item in typeDist"
          :key="item.name"
          class="type-card"
        >
          <view class="type-count">{{ item.count }}</view>
          <view class="type-name">{{ item.name }}</view>
          <view class="type-bar-wrap">
            <view class="type-bar" :style="{ width: getTypeBarWidth(item.count) }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 配送方式分布 -->
    <view class="dash-section">
      <view class="section-title">配送方式分布</view>
      <view class="delivery-list" v-if="deliveryDist && deliveryDist.length">
        <view
          v-for="item in deliveryDist"
          :key="item.name"
          class="delivery-item"
        >
          <text class="delivery-name">{{ item.name }}</text>
          <view class="delivery-bar-wrap">
            <view class="delivery-bar" :style="{ width: getDeliveryBarWidth(item.count) }"></view>
          </view>
          <text class="delivery-count">{{ item.count }} 单</text>
        </view>
      </view>
      <view v-else class="empty-tip">暂无数据</view>
    </view>

    <!-- 近30天趋势 -->
    <view class="dash-section">
      <view class="section-title">订单趋势（近{{ dailyTrend.length }}天）</view>
      <view class="trend-chart" v-if="dailyTrend && dailyTrend.length">
        <!-- 金额折线 -->
        <view class="chart-area">
          <view class="chart-y-labels">
            <text v-for="label in yLabels" :key="label" class="y-label">{{ label }}</text>
          </view>
          <view class="chart-main">
            <view class="chart-bars">
              <view
                v-for="(item, index) in dailyTrend"
                :key="index"
                class="bar-col"
              >
                <view
                  class="bar-amount"
                  :style="{ height: getAmountBarHeight(item.amount) + 'px' }"
                  :title="`¥${(item.amount/100).toFixed(2)}`"
                ></view>
                <view
                  class="bar-count"
                  :style="{ height: getCountBarHeight(item.count) + 'px' }"
                ></view>
              </view>
            </view>
          </view>
        </view>
        <view class="chart-x-labels">
          <text
            v-for="(item, index) in dailyTrend"
            :key="index"
            class="x-label"
          >{{ index % Math.ceil(dailyTrend.length / 7) === 0 ? item.date : '' }}</text>
        </view>
        <view class="chart-legend">
          <view class="legend-item"><view class="legend-dot" style="background:#1890ff;"></view><text>金额</text></view>
          <view class="legend-item"><view class="legend-dot" style="background:#52c41a;"></view><text>订单数</text></view>
        </view>
      </view>
      <view v-else class="empty-tip">暂无趋势数据</view>
    </view>

    <!-- 下单地区排行（按金额） -->
    <view class="dash-section">
      <view class="section-title">下单省份 TOP10（按实收金额）</view>
      <view class="province-ranking" v-if="provinceRanking && provinceRanking.length">
        <view
          v-for="(item, index) in provinceRanking.slice(0, 10)"
          :key="index"
          class="province-item"
        >
          <view class="prov-rank" :class="getRankClass(index)">{{ index + 1 }}</view>
          <view class="prov-info">
            <text class="prov-name">{{ item.name }}</text>
            <view class="prov-bar-wrap">
              <view class="prov-bar" :style="{ width: getProvBarWidth(item.amount) }"></view>
            </view>
          </view>
          <view class="prov-stats">
            <text class="prov-amount">{{ formatAmount(item.amount) }}</text>
            <text class="prov-count">{{ item.count }} 单</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-tip">暂无地区数据</view>
    </view>

    <!-- 下单城市排行 -->
    <view class="dash-section">
      <view class="section-title">下单城市 TOP10（按实收金额）</view>
      <view class="province-ranking" v-if="cityRanking && cityRanking.length">
        <view
          v-for="(item, index) in cityRanking.slice(0, 10)"
          :key="index"
          class="province-item"
        >
          <view class="prov-rank" :class="getRankClass(index)">{{ index + 1 }}</view>
          <view class="prov-info">
            <text class="prov-name">{{ item.name }}</text>
            <view class="prov-bar-wrap">
              <view class="prov-bar" :style="{ width: getProvBarWidth(item.amount) }"></view>
            </view>
          </view>
          <view class="prov-stats">
            <text class="prov-amount">{{ formatAmount(item.amount) }}</text>
            <text class="prov-count">{{ item.count }} 单</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-tip">暂无城市数据</view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentRange: 'month',
      dateRangeLabel: '本月',
      rangeOptions: [
        { text: '今日', value: 'today' },
        { text: '本周', value: 'week' },
        { text: '本月', value: 'month' },
        { text: '全部', value: 'all' }
      ],
      summary: { total_orders: 0, paid_orders: 0, total_amount: 0, paid_amount: 0, avg_order_value: 0 },
      todayStats: { orders: 0, amount: 0 },
      typeDist: [],
      deliveryDist: [],
      provinceRanking: [],
      cityRanking: [],
      dailyTrend: [],
      yLabels: []
    }
  },
  onLoad() {
    this.loadData();
  },
  onShow() {
    // 每次显示刷新
    // this.loadData();
  },
  methods: {
    loadData() {
      uni.showLoading({ mask: true });
      uniCloud.callFunction({
        name: 'admin-redemption-api',
        data: {
          action: 'orderStatistics',
          params: this.getDateRange()
        }
      }).then(res => {
        uni.hideLoading();
        if (res.result && res.result.errCode === 0) {
          const d = res.result.data;
          this.summary = d.summary;
          this.todayStats = d.today;
          this.typeDist = d.type_dist;
          this.deliveryDist = d.delivery_dist;
          this.provinceRanking = d.province_ranking;
          this.cityRanking = d.city_ranking;
          this.dailyTrend = d.daily_trend;
          this.calcYLabels();
        } else {
          uni.showToast({ title: (res.result && res.result.errMsg) || '加载失败', icon: 'none' });
        }
      }).catch(() => {
        uni.hideLoading();
        uni.showToast({ title: '网络异常', icon: 'none' });
      });
    },
    switchRange(range) {
      this.currentRange = range;
      const labels = { today: '今日', week: '本周', month: '本月', all: '全部' };
      this.dateRangeLabel = labels[range] || '自定义';
      this.loadData();
    },
    getDateRange() {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      let start_date, end_date;

      switch (this.currentRange) {
        case 'today':
          start_date = new Date(todayStart).toISOString().split('T')[0];
          end_date = new Date(todayStart + 86400000 - 1).toISOString().split('T')[0];
          break;
        case 'week':
          start_date = new Date(todayStart - 6 * 86400000).toISOString().split('T')[0];
          end_date = new Date(todayStart + 86400000 - 1).toISOString().split('T')[0];
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          start_date = new Date(monthStart).toISOString().split('T')[0];
          end_date = new Date(todayStart + 86400000 - 1).toISOString().split('T')[0];
          break;
        default:
          start_date = undefined;
          end_date = undefined;
      }
      return { start_date, end_date };
    },
    formatAmount(fen) {
      if (!fen) return '¥0';
      return '¥' + (fen / 100).toFixed(2);
    },
    calcYLabels() {
      if (!this.dailyTrend || !this.dailyTrend.length) return;
      const amounts = this.dailyTrend.map(d => d.amount);
      const max = Math.max(...amounts, 1);
      const step = Math.ceil(max / 4 / 10000) * 10000;
      this.yLabels = [
        '¥' + this.formatYValue(step * 4),
        '¥' + this.formatYValue(step * 3),
        '¥' + this.formatYValue(step * 2),
        '¥' + this.formatYValue(step),
        '¥0'
      ].reverse();
    },
    formatYValue(v) {
      if (v >= 100000000) return (v / 100000000).toFixed(1) + '亿';
      if (v >= 10000) return (v / 10000).toFixed(0) + '万';
      return (v / 100).toFixed(0);
    },
    getAmountBarHeight(amount) {
      const max = Math.max(...(this.dailyTrend || []).map(d => d.amount), 1);
      return Math.max(Math.round((amount / max) * 100), 2);
    },
    getCountBarHeight(count) {
      const max = Math.max(...(this.dailyTrend || []).map(d => d.count), 1);
      return Math.max(Math.round((count / max) * 50), 1);
    },
    getTypeBarWidth(count) {
      const total = (this.typeDist || []).reduce((s, d) => s + d.count, 0) || 1;
      return Math.round((count / total) * 100) + '%';
    },
    getDeliveryBarWidth(count) {
      const total = (this.deliveryDist || []).reduce((s, d) => s + d.count, 0) || 1;
      return Math.round((count / total) * 100) + '%';
    },
    getProvBarWidth(amount) {
      const max = Math.max(...(this.provinceRanking || []).map(p => p.amount), 1);
      return Math.round((amount / max) * 100) + '%';
    },
    getRankClass(index) {
      if (index === 0) return 'rank-gold';
      if (index === 1) return 'rank-silver';
      if (index === 2) return 'rank-bronze';
      return '';
    }
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 12px 16px;
  background: #f0f2f5;
  min-height: 100vh;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.range-btn {
  padding: 5px 14px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.range-btn-active { background: #1890ff; color: #fff; border-color: #1890ff; }
.arrow-down { font-size: 9px; }

/* 汇总卡片 */
.summary-cards {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.summary-card {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 12px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.summary-card-today { background: linear-gradient(135deg, #e6f7ff, #bae7ff); }
.sum-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.sum-icon-orders { background: #e6f7ff; }
.sum-icon-amount { background: #fff7e6; }
.sum-icon-today { background: rgba(24,144,255,0.15); }
.sum-info { flex: 1; min-width: 0; }
.sum-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sum-label { font-size: 11px; color: #999; margin-bottom: 1px; }
.sum-compare { font-size: 10px; color: #1890ff; }

/* 分区 */
.dash-section {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 14px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

/* 订单类型 */
.type-dist-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.type-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 12px;
}
.type-count {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}
.type-name { font-size: 12px; color: #666; margin-bottom: 6px; }
.type-bar-wrap { height: 6px; background: #e8e8e8; border-radius: 3px; overflow: hidden; }
.type-bar { height: 100%; background: linear-gradient(to right, #1890ff, #69b1ff); border-radius: 3px; transition: width 0.4s; }

/* 配送方式 */
.delivery-list { display: flex; flex-direction: column; gap: 10px; }
.delivery-item { display: flex; align-items: center; gap: 10px; }
.delivery-name { width: 90px; font-size: 13px; color: #666; flex-shrink: 0; }
.delivery-bar-wrap { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.delivery-bar { height: 100%; background: linear-gradient(to right, #52c41a, #73d13d); border-radius: 4px; transition: width 0.4s; }
.delivery-count { width: 60px; font-size: 12px; color: #999; text-align: right; flex-shrink: 0; }

/* 趋势图 */
.chart-area {
  display: flex;
  gap: 4px;
  height: 130px;
  margin-bottom: 4px;
}
.chart-y-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  flex-shrink: 0;
  width: 50px;
}
.y-label { font-size: 10px; color: #999; text-align: right; }
.chart-main { flex: 1; display: flex; align-items: flex-end; }
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
  height: 100%;
}
.bar-col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  align-items: center;
}
.bar-amount {
  width: 100%;
  background: #1890ff;
  border-radius: 3px 3px 0 0;
  opacity: 0.7;
  min-height: 2px;
  cursor: pointer;
  transition: height 0.3s, opacity 0.2s;
}
.bar-amount:hover { opacity: 1; }
.bar-count {
  width: 50%;
  background: #52c41a;
  border-radius: 2px 2px 0 0;
  min-height: 1px;
}
.chart-x-labels {
  display: flex;
  gap: 0;
  padding-left: 54px;
}
.x-label { flex: 1; font-size: 10px; color: #999; text-align: center; }
.chart-legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 8px;
}
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }

/* 地区排行 */
.province-ranking { display: flex; flex-direction: column; gap: 10px; }
.province-item { display: flex; align-items: center; gap: 10px; }
.prov-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #999;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-gold { background: #fff7e6; color: #fa8c16; }
.rank-silver { background: #f5f5f5; color: #8c8c8c; }
.rank-bronze { background: #fff1e6; color: #d46b08; }
.prov-info { flex: 1; min-width: 0; }
.prov-name { font-size: 13px; color: #333; margin-bottom: 4px; display: block; }
.prov-bar-wrap { height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.prov-bar { height: 100%; background: linear-gradient(to right, #1890ff, #69b1ff); border-radius: 3px; transition: width 0.4s; }
.prov-stats { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.prov-amount { font-size: 13px; font-weight: bold; color: #333; }
.prov-count { font-size: 11px; color: #999; }

/* 空状态 */
.empty-tip { text-align: center; padding: 24px 0; font-size: 13px; color: #999; }
</style>
