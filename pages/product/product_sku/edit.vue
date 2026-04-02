<template>
  <view class="page-shell">
    <view class="form-card">
      <view class="form-title">编辑商品 SKU</view>
      <view class="form-subtitle">可修改所属商品、图片、价格与库存</view>
      <uni-forms ref="form" :model="formData" validateTrigger="bind">
        <uni-forms-item name="product_id" label="所属商品" required>
          <view class="product-picker" @tap="openProductSelector">
            <text class="picker-label">{{ selectedProductLabel }}</text>
            <uni-icons type="right" color="#8c8479" size="22"></uni-icons>
          </view>
        </uni-forms-item>
        <uni-forms-item name="sku_name" label="SKU名称" required>
          <uni-easyinput placeholder="如规格/颜色组合" v-model="formData.sku_name"></uni-easyinput>
        </uni-forms-item>
        <uni-forms-item label="预览图">
          <view class="image-row" @tap="pickImage">
            <view class="image-selector">
              <image v-if="formData.image" :src="formData.image" class="image-preview" mode="aspectFill" />
              <view v-else class="image-placeholder">
                <text class="placeholder-text">点此上传或切换图片</text>
                <text class="image-label">支持相册/摄像头</text>
              </view>
              <text class="image-tip">{{ formData.image ? '点击更换' : '上传主图' }}</text>
            </view>
          </view>
        </uni-forms-item>
        <view class="row">
          <uni-forms-item class="flex" name="price" label="价格" required>
            <uni-easyinput placeholder="￥" type="number" v-model="formData.price"></uni-easyinput>
          </uni-forms-item>
          <uni-forms-item class="flex" name="specialPrice" label="特殊价格">
            <uni-easyinput placeholder="￥" type="number" v-model="formData.specialPrice"></uni-easyinput>
          </uni-forms-item>
        </view>
        <uni-forms-item class="flex" name="stock" label="库存" required>
          <uni-easyinput placeholder="件" type="number" v-model="formData.stock"></uni-easyinput>
        </uni-forms-item>
        <view class="action-bar">
          <button type="primary" class="primary-btn" @click="submit">保存修改</button>
          <navigator open-type="navigateBack">
            <button class="ghost-btn">返回</button>
          </navigator>
        </view>
      </uni-forms>
    </view>
    <uni-popup ref="productPopup" type="bottom" @close="onProductPopupClose">
      <view class="popup-card">
        <view class="popup-header">
          <text>选择商品</text>
          <uni-icons type="closeempty" size="22" @tap="closeProductSelector"></uni-icons>
        </view>
        <view class="search-bar">
          <input class="search-input" placeholder="输入商品ID或名称" v-model="productSearchKeyword" confirm-type="search" @confirm="loadProductOptions" />
          <button class="search-btn" @click="loadProductOptions">搜索</button>
        </view>
        <view class="options-list">
          <view v-if="productLoading" class="option-row">加载中...</view>
          <view v-else-if="!productOptions.length" class="option-row">暂无匹配商品</view>
          <view
            v-else
            v-for="item in productOptions"
            :key="item._id"
            class="option-row"
            :class="{ 'option-row-active': formData.product_id === item._id }"
            @tap="selectProduct(item)"
            @click="selectProduct(item)"
          >
            <text class="option-title">{{ item._id }} · {{ item.name }}</text>
            <text class="option-hint">选择</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  import { validator } from '../../../js_sdk/validator/product_sku.js';

  const db = uniCloud.database();
  const dbCollectionName = 'product_sku';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  export default {
    data() {
      let formData = {
        "product_id": "",
        "sku_name": "",
        "image": "",
        "price": null,
        "specialPrice": null,
        "stock": 0
      }
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        },
        formDataId: '',
        productSearchKeyword: '',
        productOptions: [],
        productLoading: false,
        selectedProductName: ''
      }
    },
    computed: {
      selectedProductLabel() {
        if (this.formData.product_id) {
          return `${this.formData.product_id} · ${this.selectedProductName || '加载中...'}`
        }
        return '请选择商品'
      }
    },
    onLoad(e) {
      if (e.id) {
        this.formDataId = e.id
        this.getDetail(e.id)
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      submit() {
        uni.showLoading({ mask: true })
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },
      submitForm(value) {
        return db.collection(dbCollectionName).doc(this.formDataId).update(value).then(() => {
          uni.showToast({ title: '修改成功' })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
        })
      },
      pickImage() {
        uni.chooseImage({
          count: 1,
          sizeType: ['original', 'compressed'],
          sourceType: ['album', 'camera'],
          success: (res) => {
            if (res.tempFilePaths && res.tempFilePaths.length) {
              this.formData.image = res.tempFilePaths[0]
            }
          }
        })
      },
      getDetail(id) {
        uni.showLoading({ mask: true })
        db.collection(dbCollectionName).doc(id).field('product_id,sku_name,image,price,specialPrice,stock').get().then((res) => {
          const data = res.result.data[0]
          if (data) {
            this.formData = data
            this.loadSelectedProductName(data.product_id)
          }
        }).catch((err) => {
          uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
        }).finally(() => {
          uni.hideLoading()
        })
      },
      openProductSelector() {
        this.productSearchKeyword = ''
        this.loadProductOptions()
        this.$nextTick(() => {
          if (this.$refs.productPopup) {
            this.$refs.productPopup.open()
          }
        })
      },
      closeProductSelector() {
        if (this.$refs.productPopup) {
          this.$refs.productPopup.close()
        }
      },
      onProductPopupClose() {
        this.productSearchKeyword = ''
      },
      async loadProductOptions() {
        this.productLoading = true
        try {
          const keyword = this.productSearchKeyword.trim()
          const res = await db.collection('product').field('_id,name').orderBy('update_at desc').limit(500).get()
          const sourceList = (res.result && res.result.data) || []
          if (!keyword) {
            this.productOptions = sourceList.slice(0, 30)
            return
          }
          const lowerKeyword = keyword.toLowerCase()
          this.productOptions = sourceList
            .filter((item) => {
              const idText = String(item._id || '').toLowerCase()
              const nameText = String(item.name || '').toLowerCase()
              return idText.includes(lowerKeyword) || nameText.includes(lowerKeyword)
            })
            .slice(0, 50)
        } catch (error) {
          console.error('加载商品选项失败', error)
          this.productOptions = []
        } finally {
          this.productLoading = false
        }
      },
      selectProduct(item) {
        this.formData.product_id = item._id
        this.selectedProductName = item.name
        this.closeProductSelector()
      },
      loadSelectedProductName(productId) {
        if (!productId) {
          this.selectedProductName = ''
          return
        }
        db.collection('product').doc(productId).field('_id,name').get().then((res) => {
          const product = (res.result && res.result.data && res.result.data[0])
          if (product) {
            this.selectedProductName = product.name
          }
        })
      }
    }
  }
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  padding: 30rpx;
}
.form-card {
  background: #fff;
  border-radius: 26rpx;
  padding: 40rpx;
  box-shadow: 0 15rpx 30rpx rgba(0,0,0,0.08);
}
.form-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #2A221D;
  margin-bottom: 10rpx;
}
.form-subtitle {
  font-size: 24rpx;
  color: #9A9184;
  margin-bottom: 24rpx;
}
.product-picker {
  border: 1rpx dashed #D8D3CB;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F9F7F2;
}
.picker-label {
  color: #8C8479;
}
.image-row {
  margin-bottom: 20rpx;
}
.image-selector {
  border: 1rpx dashed #E5DED3;
  border-radius: 22rpx;
  padding: 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: #FAF8F3;
}
.image-preview {
  width: 220rpx;
  height: 220rpx;
  border-radius: 20rpx;
  object-fit: cover;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.08);
}
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.placeholder-text {
  font-size: 26rpx;
  color: #8C8479;
}
.image-label {
  font-size: 22rpx;
  color: #B5A58D;
}
.image-tip {
  font-size: 24rpx;
  color: #705A3C;
}
.row {
  display: flex;
  gap: 20rpx;
}
.row .flex {
  flex: 1;
}
.action-bar {
  margin-top: 30rpx;
  display: flex;
  gap: 20rpx;
}
.primary-btn {
  flex: 1;
  height: 74rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #C19B6D, #A67C4C);
  color: #fff;
  font-weight: 600;
  font-size: 32rpx;
  border: none;
}
.ghost-btn {
  flex: 1;
  height: 74rpx;
  border-radius: 22rpx;
  background: #fff;
  border: 1rpx solid #D8D3CB;
  color: #2A221D;
  font-weight: 600;
  font-size: 32rpx;
}
.popup-card {
  padding: 30rpx;
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
  min-height: 60vh;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 30rpx;
  font-weight: 600;
  color: #2A221D;
}
.search-bar {
  margin: 20rpx 0;
  display: flex;
  gap: 10rpx;
}
.search-input {
  flex: 1;
  border: 1rpx solid #E5DED3;
  border-radius: 14rpx;
  padding: 14rpx;
  background: #fff;
  font-size: 26rpx;
}
.search-btn {
  padding: 14rpx 20rpx;
  border-radius: 14rpx;
  background: #BD9B78;
  color: #fff;
  border: none;
}
.options-list {
  max-height: 60vh;
  border-radius: 24rpx;
  background: #FFFDF9;
  padding: 10rpx 10rpx 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.option-row {
  padding: 18rpx 12rpx;
  border-bottom: 1rpx solid #EEEAE4;
  font-size: 26rpx;
  color: #8C8479;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.option-row-active {
  background: #F3EEE5;
}
.option-row:last-child {
  border-bottom: none;
}
.option-title {
  font-size: 26rpx;
  color: #2A221D;
}
.option-hint {
  font-size: 24rpx;
  color: #B5A58D;
}
</style>
