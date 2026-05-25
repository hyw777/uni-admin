<template>
  <view class="stats-page">
    <!-- 顶部概览卡片 -->
    <view class="overview-cards">
      <view class="ov-card">
        <view class="ov-icon ov-icon-total">📋</view>
        <view class="ov-info">
          <view class="ov-value">{{ stats.overview.total }}</view>
          <view class="ov-label">核销码总数</view>
        </view>
      </view>
      <view class="ov-card">
        <view class="ov-icon ov-icon-used">✓</view>
        <view class="ov-info">
          <view class="ov-value">{{ stats.overview.used }}</view>
          <view class="ov-label">已核销</view>
        </view>
      </view>
      <view class="ov-card">
        <view class="ov-icon ov-icon-rate">%</view>
        <view class="ov-info">
          <view class="ov-value">{{ stats.overview.used_rate }}%</view>
          <view class="ov-label">核销率</view>
        </view>
      </view>
    </view>

    <!-- 时间维度统计 -->
    <view class="section-card">
      <view class="section-title">时间维度统计</view>
      <view class="time-cards">
        <view class="time-card">
          <view class="time-value">{{ stats.timeline.today }}</view>
          <view class="time-label">今日核销</view>
        </view>
        <view class="time-card">
          <view class="time-value">{{ stats.timeline.week }}</view>
          <view class="time-label">本周核销</view>
        </view>
        <view class="time-card">
          <view class="time-value">{{ stats.timeline.month }}</view>
          <view class="time-label">本月核销</view>
        </view>
      </view>
    </view>

    <!-- 近7天趋势 -->
    <view class="section-card">
      <view class="section-title">近7天核销趋势</view>
      <view class="trend-chart" v-if="stats.trend && stats.trend.length">
        <view class="chart-bar-area">
          <view
            v-for="(item, index) in stats.trend"
            :key="index"
            class="chart-col"
          >
            <view class="bar-wrap">
              <view
                class="bar"
                :style="{ height: getBarHeight(item.count) + 'px' }"
              ></view>
            </view>
            <text class="bar-label">{{ item.date }}</text>
            <text class="bar-count">{{ item.count }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-tip">暂无数据</view>
    </view>

    <!-- 门店核销排行 -->
    <view class="section-card">
      <view class="section-title">门店核销排行</view>
      <view class="ranking-list" v-if="stats.store_ranking && stats.store_ranking.length">
        <view
          v-for="(item, index) in stats.store_ranking"
          :key="index"
          class="ranking-item"
        >
          <view class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</view>
          <view class="rank-info">
            <view class="rank-name">{{ item.store_name }}</view>
            <view class="rank-bar-wrap">
              <view class="rank-bar" :style="{ width: getStoreBarWidth(item.used_count) }"></view>
            </view>
          </view>
          <view class="rank-stats">
            <text class="rank-used">{{ item.used_count }} 已核</text>
            <text class="rank-total">/ {{ item.total_count }} 总</text>
            <text class="rank-rate">{{ item.rate }}%</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-tip">暂无核销数据</view>
    </view>

    <!-- 状态分布 -->
    <view class="section-card">
      <view class="section-title">状态分布</view>
      <view class="status-dist">
        <view class="dist-item">
          <view class="dist-dot" style="background:#52c41a;"></view>
          <text class="dist-label">已核销</text>
          <text class="dist-value">{{ stats.overview.used }}</text>
        </view>
        <view class="dist-item">
          <view class="dist-dot" style="background:#1890ff;"></view>
          <text class="dist-label">待核销</text>
          <text class="dist-value">{{ stats.overview.valid }}</text>
        </view>
        <view class="dist-item">
          <view class="dist-dot" style="background:#d9d9d9;"></view>
          <text class="dist-label">未激活</text>
          <text class="dist-value">{{ stats.overview.unused }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stats: {
        overview: { total: 0, used: 0, valid: 0, unused: 0, used_rate: '0.0' },
        timeline: { today: 0, week: 0, month: 0 },
        trend: [],
        store_ranking: []
      }
    }
  },
  onLoad() {
    this.loadStatistics();
  },
  onShow() {
    this.loadStatistics();
  },
  methods: {
    loadStatistics() {
      uni.showLoading({ mask: true });
      uniCloud.callFunction({
        name: 'admin-redemption-api',
        data: { action: 'statistics' }
      }).then(res => {
        uni.hideLoading();
        if (res.result && res.result.errCode === 0) {
          this.stats = res.result.data;
        } else {
          uni.showToast({ title: res.result?.errMsg || '加载失败', icon: 'none' });
        }
      }).catch(() => {
        uni.hideLoading();
        uni.showToast({ title: '网络异常', icon: 'none' });
      });
    },
    getBarHeight(count) {
      const max = Math.max(...(this.stats.trend || []).map(t => t.count), 1);
      return Math.max(Math.round((count / max) * 80), 4);
    },
    getStoreBarWidth(count) {
      const max = Math.max(...(this.stats.store_ranking || []).map(s => s.used_count), 1);
      return Math.round((count / max) * 100) + '%';
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
.stats-page {
  padding: 12px 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 概览卡片 */
.overview-cards {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.ov-card {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 14px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.ov-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}
.ov-icon-total { background: #e6f7ff; color: #1890ff; }
.ov-icon-used { background: #f6ffed; color: #52c41a; }
.ov-icon-rate { background: #fff7e6; color: #fa8c16; }
.ov-info { flex: 1; min-width: 0; }
.ov-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}
.ov-label { font-size: 11px; color: #999; }

/* 分区卡片 */
.section-card {
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
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

/* 时间卡片 */
.time-cards {
  display: flex;
  gap: 8px;
}
.time-card {
  flex: 1;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
}
.time-value { font-size: 22px; font-weight: bold; color: #1890ff; margin-bottom: 4px; }
.time-label { font-size: 11px; color: #999; }

/* 趋势图 */
.trend-chart { }
.chart-bar-area {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
}
.chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.bar-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}
.bar {
  width: 70%;
  max-width: 32px;
  background: linear-gradient(to top, #1890ff, #69b1ff);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}
.bar-label { font-size: 10px; color: #999; margin-top: 4px; }
.bar-count { font-size: 11px; color: #1890ff; font-weight: bold; }

/* 门店排行 */
.ranking-list { }
.ranking-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.ranking-item:last-child { border-bottom: none; }
.rank-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #999;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 10px;
}
.rank-gold { background: #fff7e6; color: #fa8c16; }
.rank-silver { background: #f5f5f5; color: #8c8c8c; }
.rank-bronze { background: #fff1e6; color: #d46b08; }
.rank-info { flex: 1; min-width: 0; }
.rank-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-bar-wrap {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}
.rank-bar {
  height: 100%;
  background: linear-gradient(to right, #1890ff, #69b1ff);
  border-radius: 2px;
  transition: width 0.4s;
}
.rank-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 10px;
  flex-shrink: 0;
}
.rank-used { font-size: 12px; color: #52c41a; font-weight: bold; }
.rank-total { font-size: 11px; color: #999; }
.rank-rate { font-size: 12px; color: #1890ff; font-weight: bold; }

/* 状态分布 */
.status-dist { display: flex; justify-content: space-around; }
.dist-item { display: flex; align-items: center; gap: 6px; }
.dist-dot { width: 10px; height: 10px; border-radius: 50%; }
.dist-label { font-size: 13px; color: #666; }
.dist-value { font-size: 14px; font-weight: bold; color: #333; }

/* 空状态 */
.empty-tip {
  text-align: center;
  padding: 30px 0;
  font-size: 13px;
  color: #999;
}
</style>
