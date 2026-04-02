<template>
  <view class="page-container" @click="onPageClick">
    <view class="uni-container">
      <uni-forms ref="form" :model="formData" validateTrigger="bind">
        <uni-forms-item name="combo_name" label="套餐名称" required>
          <uni-easyinput v-model="formData.combo_name"></uni-easyinput>
        </uni-forms-item>
        <uni-forms-item name="main_product_id" label="主商品" required>
          <view class="product-selector">
            <input class="product-input" type="text" v-model="productSearchKeyword" placeholder="输入商品名搜索" @input="onProductSearch" @focus="showProductDropdown = true" @click.stop />
            <view class="product-dropdown" v-if="showProductDropdown" @click.stop>
              <view v-if="productLoading" class="product-option">加载中...</view>
              <view v-else-if="filteredProductOptions.length === 0" class="product-option">无匹配商品</view>
              <view
                v-else
                v-for="item in filteredProductOptions"
                :key="item._id"
                class="product-option"
                :class="{ 'product-option-selected': formData.main_product_id === item._id }"
                @click="selectMainProduct(item)"
              >
                <text class="option-id">{{ item._id }}</text>
                <text class="option-name">{{ item.name }}</text>
              </view>
            </view>
            <view class="product-selected" v-if="formData.main_product_id && !showProductDropdown" @click="showProductDropdown = true">
              <text class="selected-text">{{ getSelectedProductLabel() }}</text>
              <text class="clear-btn" @click="clearMainProduct">×</text>
            </view>
          </view>
        </uni-forms-item>
        <uni-forms-item name="sub_product_ids" label="搭配商品">
          <view class="product-selector multi">
            <input class="product-input" type="text" v-model="subProductSearchKeyword" placeholder="输入商品名搜索搭配商品" @input="onSubProductSearch" @focus="showSubProductDropdown = true" @click.stop />
            <view class="product-dropdown multi-dropdown" v-if="showSubProductDropdown" @click.stop>
              <view v-if="productLoading" class="product-option">加载中...</view>
              <view v-else-if="filteredSubProductOptions.length === 0" class="product-option">无匹配商品</view>
              <view
                v-else
                v-for="item in filteredSubProductOptions"
                :key="item._id"
                class="product-option"
                :class="{ 'product-option-selected': formData.sub_product_ids.includes(item._id) }"
                @click="toggleSubProduct(item)"
              >
                <text class="option-check">{{ formData.sub_product_ids.includes(item._id) ? '✓' : '' }}</text>
                <text class="option-id">{{ item._id }}</text>
                <text class="option-name">{{ item.name }}</text>
              </view>
            </view>
            <view class="selected-tags" v-if="formData.sub_product_ids.length > 0 && !showSubProductDropdown">
              <view v-for="id in formData.sub_product_ids" :key="id" class="selected-tag">
                <text>{{ getSubProductName(id) }}</text>
                <text class="tag-remove" @click="removeSubProduct(id)">×</text>
              </view>
            </view>
          </view>
        </uni-forms-item>
        <uni-forms-item name="combo_price" label="套餐优惠总价">
          <uni-easyinput type="number" v-model="formData.combo_price"></uni-easyinput>
        </uni-forms-item>
        <uni-forms-item name="specialPrice" label="特殊价格">
          <uni-easyinput type="number" v-model="formData.specialPrice" placeholder="特殊用户专享价格，留空则不开启"></uni-easyinput>
        </uni-forms-item>
        <view class="uni-button-group">
          <button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
          <navigator open-type="navigateBack" style="margin-left: 15px;">
            <button class="uni-button" style="width: 100px;">返回</button>
          </navigator>
        </view>
      </uni-forms>
    </view>
  </view>
</template>

<script>
  import { validator } from '../../../js_sdk/validator/product_combo.js';

  const db = uniCloud.database();
  const dbCollectionName = 'product_combo';

  export default {
    data() {
      return {
        formData: {
          combo_name: '',
          main_product_id: '',
          sub_product_ids: [],
          combo_price: null,
          specialPrice: null
        },
        rules: {
          ...validator
        },
        formDataId: '',
        productOptions: [],
        productMap: {},
        productLoading: false,
        productSearchKeyword: '',
        subProductSearchKeyword: '',
        showProductDropdown: false,
        showSubProductDropdown: false
      }
    },
    computed: {
      filteredProductOptions() {
        if (!this.productSearchKeyword) {
          return this.productOptions.slice(0, 20)
        }
        const keyword = this.productSearchKeyword.toLowerCase()
        return this.productOptions.filter(item => {
          const idText = String(item._id || '').toLowerCase()
          const nameText = String(item.name || '').toLowerCase()
          return idText.includes(keyword) || nameText.includes(keyword)
        }).slice(0, 20)
      },
      filteredSubProductOptions() {
        if (!this.subProductSearchKeyword) {
          return this.productOptions.filter(item => item._id !== this.formData.main_product_id).slice(0, 20)
        }
        const keyword = this.subProductSearchKeyword.toLowerCase()
        return this.productOptions.filter(item => {
          if (item._id === this.formData.main_product_id) return false
          const idText = String(item._id || '').toLowerCase()
          const nameText = String(item.name || '').toLowerCase()
          return idText.includes(keyword) || nameText.includes(keyword)
        }).slice(0, 20)
      }
    },
    onLoad(e) {
      this.loadProductOptions()
      if (e.id) {
        this.formDataId = e.id
        this.getDetail(e.id)
      }
    },
    onPageScroll() {
      this.showProductDropdown = false
      this.showSubProductDropdown = false
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      onPageClick() {
        this.showProductDropdown = false
        this.showSubProductDropdown = false
      },
      async loadProductOptions() {
        this.productLoading = true
        try {
          const res = await db.collection('product').field('_id,name').limit(500).get()
          const list = (res.result && res.result.data) || []
          this.productOptions = list
          list.forEach(item => {
            if (item && item._id) {
              this.productMap[item._id] = item.name || ''
            }
          })
        } catch (error) {
          console.error('加载商品列表失败', error)
        } finally {
          this.productLoading = false
        }
      },
      onProductSearch() {
        this.showProductDropdown = true
      },
      onSubProductSearch() {
        this.showSubProductDropdown = true
      },
      selectMainProduct(item) {
        this.formData.main_product_id = item._id
        this.productSearchKeyword = ''
        this.showProductDropdown = false
      },
      clearMainProduct() {
        this.formData.main_product_id = ''
      },
      getSelectedProductLabel() {
        if (!this.formData.main_product_id) return ''
        return `${this.formData.main_product_id} - ${this.productMap[this.formData.main_product_id] || ''}`
      },
      toggleSubProduct(item) {
        const index = this.formData.sub_product_ids.indexOf(item._id)
        if (index > -1) {
          this.formData.sub_product_ids.splice(index, 1)
        } else {
          this.formData.sub_product_ids.push(item._id)
        }
      },
      removeSubProduct(id) {
        const index = this.formData.sub_product_ids.indexOf(id)
        if (index > -1) {
          this.formData.sub_product_ids.splice(index, 1)
        }
      },
      getSubProductName(id) {
        return `${id} - ${this.productMap[id] || ''}`
      },
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
      getDetail(id) {
        uni.showLoading({ mask: true })
        db.collection(dbCollectionName).doc(id).field("combo_name,main_product_id,sub_product_ids,combo_price,specialPrice").get().then((res) => {
          const data = res.result.data[0]
          if (data) {
            this.formData = {
              ...this.formData,
              ...data
            }
          }
        }).catch((err) => {
          uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
        }).finally(() => {
          uni.hideLoading()
        })
      }
    }
  }
</script>

<style>
.page-container {
  position: relative;
  min-height: 100vh;
}
.page-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}
.product-selector {
  position: relative;
}
.product-selector.multi {
  min-height: 80rpx;
}
.product-input {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  background: #fff;
}
.product-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.multi-dropdown {
  width: 100%;
}
.product-option {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.product-option:last-child {
  border-bottom: none;
}
.product-option:hover {
  background: #f5f7fa;
}
.product-option-selected {
  background: #ecf5ff;
  color: #409eff;
}
.option-id {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}
.option-name {
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.option-check {
  width: 20px;
  color: #409eff;
  font-weight: bold;
}
.product-selected {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.selected-text {
  color: #606266;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.clear-btn {
  color: #909399;
  font-size: 18px;
  padding: 0 5px;
}
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.selected-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #ecf5ff;
  border-radius: 4px;
  font-size: 12px;
  color: #409eff;
}
.tag-remove {
  font-size: 14px;
  cursor: pointer;
}
</style>
