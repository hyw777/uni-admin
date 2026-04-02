<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="submit">
      <uni-forms-item name="imageUrl" label="轮播图" required>
        <uni-file-picker v-model="formData.imageUrl" file-mediatype="image" return-type="object" :limit="1" @success="uploadSuccess"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="title" label="标题">
        <uni-easyinput placeholder="轮播图标题" v-model="formData.title" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="linkType" label="跳转类型">
        <uni-data-checkbox v-model="formData.linkType" :localdata="formOptions.linkType_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="linkValue" label="跳转值">
        <uni-easyinput placeholder="根据跳转类型填写：商品ID/活动ID/分类ID/链接地址" v-model="formData.linkValue" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="sort" label="排序" required>
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
  import { validator } from '../../js_sdk/validator/banner.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'banner';

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
        "imageUrl": "",
        "title": "",
        "linkType": 1,
        "linkValue": "",
        "sort": 0,
        "status": 1
      }
      return {
        formData,
        formOptions: {
          "linkType_localdata": [
            {
              "value": 1,
              "text": "商品详情"
            },
            {
              "value": 2,
              "text": "活动页面"
            },
            {
              "value": 3,
              "text": "分类页面"
            },
            {
              "value": 4,
              "text": "外部链接"
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
       * 图片上传成功
       */
      uploadSuccess(e) {
        if (e.tempFilePaths && e.tempFilePaths.length > 0) {
          this.formData.imageUrl = e.tempFilePaths[0];
        }
      },
      
      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })

        // 兼容 file-picker 返回对象的情况
        let submitData = { ...this.formData };
        if (typeof submitData.imageUrl === 'object' && submitData.imageUrl.url) {
          submitData.imageUrl = submitData.imageUrl.url;
        } else if (Array.isArray(submitData.imageUrl) && submitData.imageUrl.length > 0) {
          submitData.imageUrl = submitData.imageUrl[0].url || submitData.imageUrl[0];
        }
        
        // 手动赋值以通过校验
        this.formData.imageUrl = submitData.imageUrl;

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
        db.collection(dbCollectionName).doc(id).field("imageUrl,title,linkType,linkValue,sort,status").get().then((res) => {
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
