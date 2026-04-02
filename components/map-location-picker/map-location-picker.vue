<template>
  <view class="location-picker">
    <view class="location-display" :class="{ 'has-location': modelValue }">
      <text v-if="modelValue">{{ displayText }}</text>
      <text v-else class="placeholder">点击选择门店位置</text>
    </view>
    <button type="primary" size="mini" @click="openMapPicker" class="location-btn">
      <uni-icons type="location" size="14"></uni-icons>
      地图选点
    </button>

    <!-- 地图选点弹窗 -->
    <uni-popup ref="mapPopup" type="bottom" :mask-click="false">
      <view class="map-popup">
        <view class="map-header">
          <text class="map-title">选择门店位置</text>
          <view class="map-actions">
            <button size="mini" @click="closeMap">取消</button>
            <button type="primary" size="mini" @click="confirmLocation">确认</button>
          </view>
        </view>

        <!-- 搜索框 -->
        <view class="search-box">
          <uni-easyinput
            v-model="searchKeyword"
            placeholder="搜索地址"
            :clearable="true"
            @confirm="searchAddress"
          ></uni-easyinput>
          <button size="mini" @click="searchAddress">搜索</button>
        </view>

        <!-- 搜索结果列表 -->
        <scroll-view class="search-results" scroll-y v-if="searchResults.length > 0">
          <view
            class="search-item"
            v-for="(item, index) in searchResults"
            :key="index"
            @click="selectSearchResult(item)"
          >
            <text class="item-title">{{ item.name }}</text>
            <text class="item-address">{{ item.address }}</text>
          </view>
        </scroll-view>

        <!-- 地图容器 (H5) -->
        <view class="map-wrapper" id="h5MapWrapper">
          <div id="amapContainer" class="map-container"></div>
          <view class="center-marker">
            <view class="center-icon"></view>
          </view>
        </view>

        <!-- 地址信息 -->
        <view class="address-info" v-if="tempAddress">
          <text class="address-text">{{ tempAddress }}</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
/**
 * 地图位置选择器组件 - H5 专用
 * 使用高德地图 JS API v3
 */

import { AMAP_KEY, AMAP_SECRET_KEY } from '@/common/tencent-map-key.js'

export default {
  name: 'MapLocationPicker',
  emits: ['update:modelValue', 'change'],
  props: {
    modelValue: {
      type: [Array, Object],
      default: null
    }
  },
  data() {
    return {
      mapKey: AMAP_KEY,
      searchKeyword: '',
      searchResults: [],
      centerLat: 39.908823,
      centerLng: 116.397470,
      scale: 16,
      selectedAddress: '',
      tempAddress: '',
      pendingLocation: null,
      // 高德地图实例
      mapInstance: null,
      markerInstance: null,
      geocoderInstance: null,
      placeSearchInstance: null,
      // GeoJSON Point，uniCloud 2dsphere 索引用 { type: 'Point', coordinates: [lng, lat] }
      pendingGeoPoint: null,
      pendingCity: '',
    }
  },
    computed: {
    displayText() {
      if (!this.modelValue) return ''
      const lng = this.modelValue.coordinates ? this.modelValue.coordinates[0] : (this.modelValue[0] || 0)
      const lat = this.modelValue.coordinates ? this.modelValue.coordinates[1] : (this.modelValue[1] || 0)
      return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
    }
  },
    watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        if (val && val.coordinates && val.coordinates.length === 2) {
          // GeoJSON Point 格式
          this.centerLng = val.coordinates[0]
          this.centerLat = val.coordinates[1]
          if (this.mapInstance) {
            this.updateMapCenter(this.centerLng, this.centerLat)
          }
        } else if (val && val.length === 2) {
          // 兼容旧数组格式
          this.centerLat = val[1]
          this.centerLng = val[0]
          if (this.mapInstance) {
            this.updateMapCenter(this.centerLng, this.centerLat)
          }
        }
      }
    }
  },
  methods: {
    // 动态加载高德 JS API
    loadAMapScript() {
      if (window.AMap && window.AMap.Map) {
        return Promise.resolve()
      }
      if (this._amapScriptPromise) {
        return this._amapScriptPromise
      }
      // 设置安全密钥（v2.0 起必须，否则 Geocoder 等插件会报 USERKEY_PLAT_NOMATCH）
      if (AMAP_SECRET_KEY) {
        window._AMapSecurityConfig = {
          securityJsCode: AMAP_SECRET_KEY
        }
      }
      this._amapScriptPromise = new Promise((resolve, reject) => {
        window._amapInitCallback = () => resolve()
        const s = document.createElement('script')
        s.charset = 'utf-8'
        s.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&callback=_amapInitCallback`
        s.onerror = () => {
          this._amapScriptPromise = null
          delete window._amapInitCallback
          reject(new Error('amap js'))
        }
        document.head.appendChild(s)
      })
      return this._amapScriptPromise
    },

    openMapPicker() {
      this.$refs.mapPopup.open()
      setTimeout(() => {
        if (!this.mapInstance) {
          this.initMap()
        } else {
          const lng = this.modelValue?.coordinates ? this.modelValue.coordinates[0] : (this.modelValue && this.modelValue[0])
          const lat = this.modelValue?.coordinates ? this.modelValue.coordinates[1] : (this.modelValue && this.modelValue[1])
          if (lng != null && lat != null) {
            this.updateMapCenter(lng, lat)
            this.doReverseGeocode(lng, lat)
          }
        }
      }, 300)
    },

    closeMap() {
      this.$refs.mapPopup.close()
      this.searchKeyword = ''
      this.searchResults = []
    },

    confirmLocation() {
      if (this.pendingGeoPoint) {
        this.$emit('update:modelValue', this.pendingGeoPoint)
        const address = this.selectedAddress ? this.selectedAddress.trim() : ''
        const city = this.pendingCity || ''
        this.$emit('change', {
          location: this.pendingGeoPoint,
          address,
          city
        })
      }
      this.closeMap()
    },

    // 初始化高德地图
    initMap() {
      if (!this.mapKey) {
        uni.showToast({ title: '请先配置高德地图 Key', icon: 'none', duration: 3500 })
        return
      }
      this.loadAMapScript()
        .then(() => {
          this.$nextTick(() => this._initMapAfterScript())
        })
        .catch(() => {
          uni.showToast({ title: '高德地图脚本加载失败，请检查 Key 与网络', icon: 'none', duration: 3500 })
        })
    },

    _initMapAfterScript() {
      const container = document.getElementById('amapContainer')
      if (!container) {
        console.error('地图容器未找到')
        return
      }

      const wrapper = document.getElementById('h5MapWrapper')
      if (wrapper) {
        wrapper.style.flex = '1'
        wrapper.style.minHeight = '300px'
      }

      this.mapInstance = new window.AMap.Map('amapContainer', {
        center: new window.AMap.LngLat(this.centerLng, this.centerLat),
        zoom: this.scale,
        draggable: true,
        scrollWheel: true,
        zoomControl: true
      })

      this.addMarker(this.centerLng, this.centerLat)
      this._initPlugins()

      this.mapInstance.on('dragend', () => {
        const c = this.mapInstance.getCenter()
        this.onMapMove(c.getLng(), c.getLat())
      })

      this.mapInstance.on('zoomchange', () => {
        const c = this.mapInstance.getCenter()
        this.onMapMove(c.getLng(), c.getLat())
      })

      this.mapInstance.on('click', (e) => {
        this.onMapMove(e.lnglat.getLng(), e.lnglat.getLat())
      })
    },

    // 初始化插件（地理编码 + 搜索）
    _initPlugins() {
      window.AMap.plugin(['AMap.Geocoder', 'AMap.PlaceSearch'], () => {
        this.geocoderInstance = new window.AMap.Geocoder({ city: '全国' })
        this.placeSearchInstance = new window.AMap.PlaceSearch({
          city: '全国',
          citylimit: false,
          pageSize: 10,
          pageIndex: 1,
          extensions: 'all'
        })
      })
    },

    // 添加/更新标记
    addMarker(lng, lat) {
      if (this.markerInstance) {
        this.markerInstance.setMap(null)
      }
      this.markerInstance = new window.AMap.Marker({
        position: new window.AMap.LngLat(lng, lat),
        animation: 'AMap.DROP',
        anchor: 'bottom-center'
      })
      this.markerInstance.setMap(this.mapInstance)
    },

    // 地图移动处理
    onMapMove(lng, lat) {
      this.centerLng = lng
      this.centerLat = lat
      this.addMarker(lng, lat)
      this.pendingLocation = [lng, lat]
      this.pendingGeoPoint = { type: 'Point', coordinates: [lng, lat] }
      this.tempAddress = `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}`
      this.selectedAddress = ''
      this.doReverseGeocode(lng, lat)
    },

    // 更新地图中心点
    updateMapCenter(lng, lat) {
      if (this.mapInstance) {
        this.mapInstance.setCenter(new window.AMap.LngLat(lng, lat))
        this.addMarker(lng, lat)
      }
    },

    // 搜索地址
    searchAddress() {
      if (!this.searchKeyword.trim()) {
        this.searchResults = []
        return
      }
      if (!this.placeSearchInstance) {
        window.AMap.plugin(['AMap.PlaceSearch'], () => {
          this.placeSearchInstance = new window.AMap.PlaceSearch({
            city: '全国', citylimit: false, pageSize: 10, extensions: 'all'
          })
          this._doSearch()
        })
      } else {
        this._doSearch()
      }
    },

    _doSearch() {
      // 取消上一次请求
      if (this._lastSearchXhr) {
        this._lastSearchXhr.abort()
        this._lastSearchXhr = null
      }
      this.placeSearchInstance.search(this.searchKeyword, (status, result) => {
        if (status === 'complete' && result.info === 'OK' && result.poiList && result.poiList.pois) {
          this.searchResults = result.poiList.pois.map(p => ({
            name: p.name,
            address: p.address || p.pname + p.cityname + p.adname,
            lng: parseFloat(p.location.lng),
            lat: parseFloat(p.location.lat)
          }))
        } else {
          this.searchResults = []
          const msg = result?.info || '搜索失败'
          uni.showToast({ title: msg, icon: 'none', duration: 3500 })
        }
      })
    },

    // 选择搜索结果
    selectSearchResult(item) {
      if (this.mapInstance) {
        this.mapInstance.setCenter(new window.AMap.LngLat(item.lng, item.lat))
        this.addMarker(item.lng, item.lat)
      }
      this.centerLng = item.lng
      this.centerLat = item.lat
      this.pendingLocation = [item.lng, item.lat]
      this.pendingGeoPoint = { type: 'Point', coordinates: [item.lng, item.lat] }
      this.selectedAddress = item.address || item.name
      this.tempAddress = item.address || item.name
      this.searchResults = []
      this.searchKeyword = ''
    },

    // 逆地理编码
    doReverseGeocode(lng, lat) {
      if (!this.geocoderInstance) {
        window.AMap.plugin(['AMap.Geocoder'], () => {
          this.geocoderInstance = new window.AMap.Geocoder({ city: '全国' })
          this._execReverseGeocode(lng, lat)
        })
      } else {
        this._execReverseGeocode(lng, lat)
      }
    },

    _execReverseGeocode(lng, lat) {
      this.geocoderInstance.getAddress(new window.AMap.LngLat(lng, lat), (status, result) => {
        if (status === 'complete' && result.info === 'OK' && result.regeocode) {
          const addr = result.regeocode.formattedAddress
          this.selectedAddress = addr
          this.tempAddress = addr
          // 提取城市名（直辖市 city 为空，取 province）
          this.pendingCity = result.regeocode.addressComponent.city
            || result.regeocode.addressComponent.province
            || ''
        } else {
          const coordStr = `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}`
          this.tempAddress = coordStr
          this.selectedAddress = ''
          this.pendingCity = ''
          uni.showToast({
            title: '地址解析失败，请检查 Key 与域名白名单',
            icon: 'none',
            duration: 3500
          })
        }
      })
    },

    // 销毁地图
    destroyMap() {
      if (this.mapInstance) {
        this.mapInstance.destroy()
        this.mapInstance = null
        this.markerInstance = null
        this.geocoderInstance = null
        this.placeSearchInstance = null
      }
    }
  },
  beforeUnmount() {
    this.destroyMap()
  }
}
</script>

<style scoped>
.location-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-display {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: #f5f5f5;
  color: #333;
  min-height: 36px;
}

.location-display.has-location {
  background: #fff;
}

.location-display .placeholder {
  color: #999;
}

.location-btn {
  white-space: nowrap;
}

.map-popup {
  width: 100%;
  height: 75vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.map-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.map-actions {
  display: flex;
  gap: 8px;
}

.search-box {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.search-box uni-easyinput {
  flex: 1;
}

.search-results {
  max-height: 120px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.search-item {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  flex-direction: column;
}

.search-item:last-child {
  border-bottom: none;
}

.item-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.item-address {
  font-size: 12px;
  color: #999;
}

.map-wrapper {
  position: relative;
  flex: 1;
  min-height: 300px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  z-index: 10;
  pointer-events: none;
}

.center-icon {
  width: 24px;
  height: 24px;
  background: #ff4d4f;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.address-info {
  padding: 12px 16px;
  background: #f9f9f9;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.address-text {
  font-size: 14px;
  color: #333;
}
</style>
