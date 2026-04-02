<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="order_type" label="" required>
        <uni-easyinput placeholder="订单类型: normal(普通商品), group_online(线上团购), group_offline(线下体验/代金券)" v-model="formData.order_type"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="items" label="">
        <uni-data-checkbox :multiple="true" v-model="formData.items"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="total_fee" label="" required>
        <uni-easyinput placeholder="总金额（分）" type="number" v-model="formData.total_fee"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="" required>
        <uni-easyinput placeholder="订单状态：0未支付，1已支付(待发货/待核销)，2已发货，3已完成，-1已取消" type="number" v-model="formData.status"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="store_id" label="">
        <uni-easyinput placeholder="关联门店ID(到店核销使用)" v-model="formData.store_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="redemption_store_name" label="">
        <uni-easyinput placeholder="核销门店名称" v-model="formData.redemption_store_name"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="redemption_store_address" label="">
        <uni-easyinput placeholder="核销门店地址" v-model="formData.redemption_store_address"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="redemption_store_mobile" label="">
        <uni-easyinput placeholder="核销门店电话" v-model="formData.redemption_store_mobile"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="delivery_method" label="配送方式">
        <uni-easyinput placeholder="1:快递 2:大件物流 3:送货入户带安装 4:同城车队" type="number" v-model="formData.delivery_method"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="logistics_company" label="物流公司">
        <uni-easyinput v-model="formData.logistics_company"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="logistics_no" label="物流单号">
        <uni-easyinput v-model="formData.logistics_no"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="installation_status" label="安装状态">
        <uni-easyinput placeholder="0:无 1:待分配 2:待安装 3:已安装" type="number" v-model="formData.installation_status"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="address" label="">
        <undefined v-model="formData.address"></undefined>
      </uni-forms-item>
      <uni-forms-item name="user_id" label="" required>
        <uni-easyinput placeholder="下单用户" v-model="formData.user_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="create_date" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.create_date"></uni-datetime-picker>
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
  import { validator } from '../../js_sdk/validator/order.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'order';

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
        "order_type": "",
        "items": [],
        "total_fee": null,
        "status": 0,
        "store_id": "",
        "redemption_store_name": "",
        "redemption_store_address": "",
        "redemption_store_mobile": "",
        "delivery_method": null,
        "logistics_company": "",
        "logistics_no": "",
        "installation_status": null,
        "address": null,
        "user_id": "",
        "create_date": null
      }
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
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
