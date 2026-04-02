<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="name" label="品牌名称" required>
        <uni-easyinput v-model="formData.name"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="logo" label="品牌Logo">
        <uni-file-picker file-mediatype="image" return-type="object" v-model="imageValue"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="description" label="品牌描述">
        <uni-easyinput v-model="formData.description"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="score_delivery" label="发货评分">
        <uni-easyinput v-model="formData.score_delivery"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="score_quality" label="质量评分">
        <uni-easyinput v-model="formData.score_quality"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="score_service" label="服务评分">
        <uni-easyinput v-model="formData.score_service"></uni-easyinput>
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
  import { validator } from '../../js_sdk/validator/brand.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'brand';

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
        "description": "",
        "score_delivery": "",
        "score_quality": "",
        "score_service": ""
      }
      return {
        imageValue: null,
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    watch: {
      imageValue(val) {
        if (val && val.url) {
          this.formData.logo = val.url
        } else {
          this.formData.logo = ''
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      
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
        // 使用 clientDB 提交数据
        return db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            title: '新增成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        })
      }
    }
  }
</script>
