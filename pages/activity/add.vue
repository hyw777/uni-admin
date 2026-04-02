<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="title" label="活动标题" required>
        <uni-easyinput placeholder="活动标题" v-model="formData.title" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="type" label="活动类型" required>
        <uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="image" label="活动图片">
        <uni-file-picker file-mediatype="image" return-type="object" v-model="imageValue"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="description" label="活动描述">
        <uni-easyinput placeholder="活动详细描述" v-model="formData.description" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="discount" label="折扣">
        <uni-easyinput placeholder="限时折扣时使用，如0.8表示8折" type="number" v-model="formData.discount"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="fullAmount" label="满减金额">
        <uni-easyinput placeholder="满减活动时使用，满多少元" type="number" v-model="formData.fullAmount"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="reduceAmount" label="减多少">
        <uni-easyinput placeholder="满减活动时使用，减多少元" type="number" v-model="formData.reduceAmount"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="couponValue" label="优惠券金额">
        <uni-easyinput placeholder="优惠券金额" type="number" v-model="formData.couponValue"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="couponMinAmount" label="最低使用金额">
        <uni-easyinput placeholder="优惠券最低使用金额" type="number" v-model="formData.couponMinAmount"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="startTime" label="开始时间" required>
        <uni-datetime-picker return-type="timestamp" v-model="formData.startTime"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="endTime" label="结束时间" required>
        <uni-datetime-picker return-type="timestamp" v-model="formData.endTime"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="sort" label="排序">
        <uni-easyinput placeholder="数字越小越靠前" type="number" v-model="formData.sort"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="状态" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
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
  import { validator } from '../../js_sdk/validator/activity.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'activity';

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
        "title": "",
        "type": null,
        "image": "",
        "description": "",
        "discount": null,
        "fullAmount": null,
        "reduceAmount": null,
        "couponValue": null,
        "couponMinAmount": null,
        "startTime": null,
        "endTime": null,
        "sort": 0,
        "status": 1
      }
      return {
        imageValue: null,
        formData,
        formOptions: {
          "type_localdata": [
            {
              "value": 1,
              "text": "限时折扣"
            },
            {
              "value": 2,
              "text": "满减活动"
            },
            {
              "value": 3,
              "text": "优惠券"
            }
          ],
          "status_localdata": [
            {
              "value": 0,
              "text": "禁用"
            },
            {
              "value": 1,
              "text": "启用"
            }
          ]
        },
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    watch: {
      imageValue(val) {
        if (val && val.url) {
          this.formData.image = val.url
        } else {
          this.formData.image = ''
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
        if (this.formData.image && typeof this.formData.image === 'object' && this.formData.image.url) {
          this.formData.image = this.formData.image.url
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
