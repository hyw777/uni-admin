<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="name" label="门店名称" required>
        <uni-easyinput placeholder="门店名称" v-model="formData.name" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="logo" label="门店Logo">
        <uni-file-picker file-mediatype="image" :limit="1" return-type="object" v-model="logoValue"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="address" label="门店地址">
        <uni-easyinput placeholder="详细地址" v-model="formData.address" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="location" label="门店位置">
        <map-location-picker
          v-model="formData.location"
          @change="onLocationChange"
        ></map-location-picker>
      </uni-forms-item>
      <uni-forms-item name="city" label="城市" required>
        <uni-easyinput placeholder="选点后自动填充" v-model="formData.city" trim="both" :disabled="true"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="rating" label="评分">
        <uni-easyinput placeholder="默认0" v-model="formData.rating" type="number" :disabled="true"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="recentSales" label="近期销量">
        <uni-easyinput placeholder="默认0" v-model="formData.recentSales" :disabled="true"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="tags" label="标签">
        <uni-data-checkbox :multiple="true" v-model="formData.tags" :localdata="formOptions.tags_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
          <button class="uni-button" style="width: 100px;">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/store.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'store';

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
        "name": "",
        "logo": "",
        "address": "",
        "city": "",
        "rating": 0,
        "recentSales": "",
        "tags": [],
        "location": null
      }
      return {
        logoValue: null,
        formData,
        formOptions: {
          tags_localdata: [
            { value: '金牌商家', text: '金牌商家' },
            { value: '连锁门店', text: '连锁门店' },
            { value: '认证门店', text: '认证门店' }
          ]
        },
        rules: {
          ...getValidator(['name', 'logo', 'address', 'city', 'rating', 'recentSales', 'tags', 'location'])
        }
      }
    },
    onLoad(e) {
      if (e.id) {
        const id = e.id
        this.formDataId = id
        this.getDetail(id)
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    watch: {
      logoValue(val) {
        if (val && val.url) {
          this.formData.logo = val.url
        } else {
          this.formData.logo = ''
        }
      }
    },
    methods: {
      onLocationChange(e) {
        // 当地图选点完成后，同步更新 address 和 city 字段
        if (e) {
          if (e.address) this.formData.address = e.address
          if (e.city) this.formData.city = e.city
        }
      },

      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        if (this.formData.logo && typeof this.formData.logo === 'object' && this.formData.logo.url) {
          this.formData.logo = this.formData.logo.url
        }
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },

      /**
       * 提交表单
       */
      submitForm(value) {
        return db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
          uni.showToast({
            title: '修改成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        })
      },

      /**
       * 获取表单数据
       * @param {Object} id
       */
      getDetail(id) {
        uni.showLoading({
          mask: true
        })
        db.collection(dbCollectionName).doc(id).field("name,logo,address,city,rating,recentSales,tags,location").get().then((res) => {
          const data = res.result.data[0]
          if (data) {
            this.formData = data
            if (this.formData.logo) {
              this.logoValue = {
                url: this.formData.logo,
                name: '门店Logo'
              }
            }
          }
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        }).finally(() => {
          uni.hideLoading()
        })
      }
    }
  }
</script>
