<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="name" label="分类名称" required>
        <uni-easyinput placeholder="分类名称，如：沙发、床、餐桌等" v-model="formData.name" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="icon" label="分类图标">
        <uni-file-picker file-mediatype="image" return-type="object" v-model="imageValue"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="level" label="分类级别" required>
        <uni-data-checkbox v-model="formData.level" :localdata="formOptions.level_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="parentId" label="父级分类ID">
        <uni-easyinput placeholder="一级分类为空，二级分类填写父级ID" v-model="formData.parentId" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="filterType" label="筛选类型">
        <uni-data-checkbox v-model="formData.filterType" :localdata="formOptions.filterType_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="sort" label="排序" required>
        <uni-easyinput placeholder="数字越小越靠前" type="number" v-model="formData.sort"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="specialOnly" label="特殊分类">
        <uni-data-checkbox v-model="formData.specialOnly" :localdata="formOptions.specialOnly_localdata"></uni-data-checkbox>
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
  import { validator } from '../../js_sdk/validator/category.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'category';

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
        "icon": "",
        "level": null,
        "parentId": "",
        "filterType": null,
        "sort": 0,
        "specialOnly": false,
        "status": 1
      }
      return {
        imageValue: null,
        formData,
        formOptions: {
          "level_localdata": [
            {
              "value": 1,
              "text": "一级分类"
            },
            {
              "value": 2,
              "text": "二级分类"
            }
          ],
          "filterType_localdata": [
            {
              "value": 1,
              "text": "风格"
            },
            {
              "value": 2,
              "text": "尺寸"
            },
            {
              "value": 3,
              "text": "材质"
            },
            {
              "value": 4,
              "text": "其他"
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
          ],
          "specialOnly_localdata": [
            {
              "value": true,
              "text": "是"
            },
            {
              "value": false,
              "text": "否"
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
          this.formData.icon = val.url
        } else {
          this.formData.icon = ''
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
    methods: {
      
      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        if (this.formData.icon && typeof this.formData.icon === 'object' && this.formData.icon.url) {
          this.formData.icon = this.formData.icon.url
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
        db.collection(dbCollectionName).doc(id).field("name,icon,level,parentId,filterType,sort,status,specialOnly").get().then((res) => {
          const data = res.result.data[0]
          if (data) {
            this.formData = data

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
