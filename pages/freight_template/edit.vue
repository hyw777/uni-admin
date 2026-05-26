<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" :rules="rules" validateTrigger="bind">
      <uni-forms-item name="name" label="模板名称" required>
        <uni-easyinput v-model="formData.name" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="is_free" label="是否包邮">
        <switch @change="binddata('is_free', $event.detail.value)" :checked="formData.is_free"></switch>
      </uni-forms-item>
      <view v-if="!formData.is_free">
        <uni-forms-item name="charge_type" label="计费方式" required>
          <uni-data-checkbox v-model="formData.charge_type" :localdata="chargeTypeOptions"></uni-data-checkbox>
        </uni-forms-item>
        
        <view class="uni-group">
          <view class="uni-title">默认运费设置</view>
        </view>
        <view style="display:flex; gap:10px;">
          <uni-forms-item name="default_first" label="首件/重/体积(单位)" label-width="120">
            <uni-easyinput type="digit" v-model="formData.default_first"></uni-easyinput>
          </uni-forms-item>
          <uni-forms-item name="default_fee" label="首费(元)" label-width="80">
            <uni-easyinput type="digit" v-model="formData.default_fee"></uni-easyinput>
          </uni-forms-item>
        </view>
        <view style="display:flex; gap:10px;">
          <uni-forms-item name="default_continue" label="续件/重/体积(单位)" label-width="120">
            <uni-easyinput type="digit" v-model="formData.default_continue"></uni-easyinput>
          </uni-forms-item>
          <uni-forms-item name="default_continue_fee" label="续费(元)" label-width="80">
            <uni-easyinput type="digit" v-model="formData.default_continue_fee"></uni-easyinput>
          </uni-forms-item>
        </view>

        <view class="uni-group" style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
          <view class="uni-title">省份附加运费规则 (可选)</view>
          <button @click="addRegionRule" size="mini" type="primary">新增省份规则</button>
        </view>
        <view v-for="(rule, index) in regionRules" :key="index" style="display:flex; gap:10px; align-items:center; margin-bottom:10px; background:#f9f9f9; padding:10px;">
          <uni-forms-item label="省份名称" :label-width="80" style="margin-bottom:0;">
            <uni-data-select v-model="rule.province_name" :localdata="provinceOptions"></uni-data-select>
          </uni-forms-item>
          <uni-forms-item label="附加运费(元)" :label-width="100" style="margin-bottom:0;">
            <uni-easyinput type="digit" v-model="rule.additional_fee"></uni-easyinput>
          </uni-forms-item>
          <button @click="removeRegionRule(index)" size="mini" type="warn">删除</button>
        </view>
      </view>

      <view class="uni-button-group">
        <button type="primary" class="uni-button" @click="submit" style="width: 100px;">提交</button>
        <button class="uni-button" style="width: 100px; margin-left: 15px;" @click="goBack">返回</button>
      </view>
    </uni-forms>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const db = uniCloud.database()

const form = ref(null)
const formDataId = ref('')
const formData = ref({
  name: '',
  is_free: false,
  charge_type: 1,
  default_first: 1,
  default_fee: 0,
  default_continue: 1,
  default_continue_fee: 0
})

const regionRules = ref([])

const chargeTypeOptions = [
  { text: '按件', value: 1 },
  { text: '按重量', value: 2 },
  { text: '按体积', value: 3 }
]

const provinceOptions = [
  { text: '北京市', value: '北京市' },
  { text: '天津市', value: '天津市' },
  { text: '河北省', value: '河北省' },
  { text: '山西省', value: '山西省' },
  { text: '内蒙古自治区', value: '内蒙古自治区' },
  { text: '辽宁省', value: '辽宁省' },
  { text: '吉林省', value: '吉林省' },
  { text: '黑龙江省', value: '黑龙江省' },
  { text: '上海市', value: '上海市' },
  { text: '江苏省', value: '江苏省' },
  { text: '浙江省', value: '浙江省' },
  { text: '安徽省', value: '安徽省' },
  { text: '福建省', value: '福建省' },
  { text: '江西省', value: '江西省' },
  { text: '山东省', value: '山东省' },
  { text: '河南省', value: '河南省' },
  { text: '湖北省', value: '湖北省' },
  { text: '湖南省', value: '湖南省' },
  { text: '广东省', value: '广东省' },
  { text: '广西壮族自治区', value: '广西壮族自治区' },
  { text: '海南省', value: '海南省' },
  { text: '重庆市', value: '重庆市' },
  { text: '四川省', value: '四川省' },
  { text: '贵州省', value: '贵州省' },
  { text: '云南省', value: '云南省' },
  { text: '西藏自治区', value: '西藏自治区' },
  { text: '陕西省', value: '陕西省' },
  { text: '甘肃省', value: '甘肃省' },
  { text: '青海省', value: '青海省' },
  { text: '宁夏回族自治区', value: '宁夏回族自治区' },
  { text: '新疆维吾尔自治区', value: '新疆维吾尔自治区' },
  { text: '台湾省', value: '台湾省' },
  { text: '香港特别行政区', value: '香港特别行政区' },
  { text: '澳门特别行政区', value: '澳门特别行政区' }
]

const rules = {
  name: { rules: [{ required: true, errorMessage: '模板名称不能为空' }] },
  charge_type: { rules: [{ required: true }] }
}

onLoad((options) => {
  if (options.id) {
    formDataId.value = options.id
    getDetail(options.id)
  }
})

const binddata = (name, value) => {
  formData.value[name] = value
}

function goBack() {
  uni.navigateBack()
}

const addRegionRule = () => {
  regionRules.value.push({
    province_name: '',
    additional_fee: 0
  })
}

const removeRegionRule = (index) => {
  regionRules.value.splice(index, 1)
}

const getDetail = async (id) => {
  uni.showLoading({ title: '加载中' })
  try {
    const res = await db.collection('freight_template').doc(id).get()
    if (res.result.data && res.result.data.length > 0) {
      let data = res.result.data[0]
      formData.value = {
        name: data.name,
        is_free: data.is_free,
        charge_type: data.charge_type,
        default_first: data.default_first,
        default_fee: data.default_fee,
        default_continue: data.default_continue,
        default_continue_fee: data.default_continue_fee
      }
    }
    
    // load region rules
    const rulesRes = await db.collection('freight_region_rules').where({ template_id: id }).get()
    if (rulesRes.result.data) {
      regionRules.value = rulesRes.result.data.map(r => ({
        province_name: r.province_name,
        additional_fee: r.additional_fee
      }))
    }
  } catch(e) {
    uni.showModal({ content: '加载失败: ' + e.message, showCancel: false })
  } finally {
    uni.hideLoading()
  }
}

const getOpenerEventChannel = () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  return page.getOpenerEventChannel ? page.getOpenerEventChannel() : null
}

const submit = async () => {
  try {
    await form.value.validate()
    
    uni.showLoading({ title: '提交中' })
    
    // cast numbers
    let payload = { ...formData.value }
    payload.charge_type = parseInt(payload.charge_type)
    payload.default_first = parseFloat(payload.default_first) || 0
    payload.default_fee = parseFloat(payload.default_fee) || 0
    payload.default_continue = parseFloat(payload.default_continue) || 0
    payload.default_continue_fee = parseFloat(payload.default_continue_fee) || 0

    await db.collection('freight_template').doc(formDataId.value).update(payload)

    // replace region rules
    // Step 1: remove existing
    const existingRules = await db.collection('freight_region_rules').where({ template_id: formDataId.value }).get()
    if (existingRules.result.data && existingRules.result.data.length > 0) {
      const idsToDelete = existingRules.result.data.map(r => r._id)
      for (const id of idsToDelete) {
        await db.collection('freight_region_rules').doc(id).remove()
      }
    }

    // Step 2: insert new ones
    const validRules = regionRules.value.filter(r => r.province_name.trim() !== '')
    if (validRules.length > 0) {
      const rulesPayload = validRules.map(r => ({
        template_id: formDataId.value,
        province_name: r.province_name.trim(),
        additional_fee: parseFloat(r.additional_fee) || 0
      }))
      for (const rp of rulesPayload) {
        await db.collection('freight_region_rules').add(rp)
      }
    }

    uni.hideLoading()
    uni.showToast({ title: '修改成功' })
    
    const eventChannel = getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('refreshData')
    }
    setTimeout(() => uni.navigateBack(), 500)

  } catch (err) {
    uni.hideLoading()
    uni.showModal({
      content: err.message || '请求服务失败',
      showCancel: false
    })
  }
}
</script>
