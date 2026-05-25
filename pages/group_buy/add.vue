<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="store_id" label="门店" required>
        <uni-data-select collection="store" field="name as text, _id as value" v-model="formData.store_id" placeholder="请选择门店"></uni-data-select>
      </uni-forms-item>
      
      <uni-forms-item name="title" label="标题" required>
        <uni-easyinput placeholder="Deal title" v-model="formData.title"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="category" label="分类">
        <uni-easyinput placeholder="Category: 代金券, 沙发套餐, 灯具套餐, 四件套, 家装代金券 ..." v-model="formData.category"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="type" label="类型" required>
        <uni-data-select :localdata="[{value:'online',text:'线上发货'},{value:'offline',text:'到店核销'}]" v-model="formData.type" placeholder="选中发货类型"></uni-data-select>
      </uni-forms-item>
      <uni-forms-item name="price" label="团购价" required>
        <uni-easyinput placeholder="Current price" type="number" v-model="formData.price"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="originalPrice" label="原价">
        <uni-easyinput placeholder="Original price" type="number" v-model="formData.originalPrice"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="specialPrice" label="会员价">
        <uni-easyinput placeholder="Special/VIP user price" type="number" v-model="formData.specialPrice"></uni-easyinput>
      </uni-forms-item>
      
      <uni-forms-item name="image" label="封面图">
        <uni-file-picker v-model="imageValue" return-type="object" :image-styles="imageStyles"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="images" label="轮播图">
        <uni-file-picker v-model="imagesValue" return-type="array" :image-styles="imageStyles"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="description" label="详情图文">
        <uni-easyinput placeholder="Rich text detail description" v-model="formData.description"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="notice" label="购买须知">
        <uni-easyinput placeholder="Usage notice/注意事项" v-model="formData.notice"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="specs" label="规格">
        <view v-for="(item, index) in specsList" :key="index" style="display: flex; align-items: center; margin-bottom: 10px;">
          <uni-easyinput placeholder="规格名 (如: 颜色)" v-model="item.label" style="flex: 1; margin-right: 10px;"></uni-easyinput>
          <uni-easyinput placeholder="规格值 (如: 红色)" v-model="item.value" style="flex: 1; margin-right: 10px;"></uni-easyinput>
          <button class="uni-button" size="mini" type="warn" @click="removeSpec(index)" style="margin: 0; padding: 0 10px;">-</button>
          <button class="uni-button" size="mini" type="primary" @click="addSpec" v-if="index === specsList.length - 1" style="margin: 0 0 0 10px; padding: 0 10px;">+</button>
        </view>
        <button v-if="specsList.length === 0" class="uni-button" size="mini" type="primary" @click="addSpec" style="margin-top: 5px;">+ 新增规格</button>
      </uni-forms-item>
      <uni-forms-item name="status" label="状态">
        <uni-data-select :localdata="[{value:1,text:'上架'},{value:0,text:'下架'}]" v-model="formData.status" :clear="false"></uni-data-select>
      </uni-forms-item>

      <uni-forms-item name="create_date" label="创建时间">
        <uni-datetime-picker return-type="timestamp" v-model="formData.create_date"></uni-datetime-picker>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit" :disabled="submitting">提交</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
          <button class="uni-button" style="width: 100px;">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/group_buy.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'group_buy';

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
      const imageStyles = { width: 100, height: 100, border: { radius: "8px" } };
      let formData = {
        "store_id": "",
        "title": "",
        "category": "",
        "type": "",
        "price": null,
        "originalPrice": null,
        "specialPrice": null,
        "image": "",
        "images": [],
        "description": "",
        "notice": "",
        "specs": [],
        "status": 1,
        "create_date": null
      }
      return {
        formData,
        imageValue: null,
        imagesValue: [],
        specsList: [],
        submitting: false,
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      addSpec() {
        this.specsList.push({ label: '', value: '' })
      },
      removeSpec(index) {
        this.specsList.splice(index, 1)
      },
      async submit() {
        if (this.submitting) return;
        
        uni.showLoading({ mask: true });
        this.submitting = true;
        
        try {
          // 处理封面图 - 确保获取 cloud:// 开头的 fileID
          if (this.imageValue) {
            this.formData.image = this.imageValue.fileID || this.imageValue.url || '';
          } else {
            this.formData.image = '';
          }
          
          // 处理轮播图
          if (this.imagesValue && this.imagesValue.length) {
            this.formData.images = this.imagesValue.map(item => item.fileID || item.url);
          } else {
            this.formData.images = [];
          }
          
          this.formData.specs = this.specsList.filter(item => item.label && item.value).map(item => ({ label: item.label, value: item.value }));

          const res = await this.$refs.form.validate();
          await this.submitForm(res);
        } catch (err) {
          console.error('Submit error:', err);
        } finally {
          this.submitting = false;
          uni.hideLoading();
        }
      },

      submitForm(value) {
        return db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({ title: '新增成功' });
          this.getOpenerEventChannel().emit('refreshData');
          setTimeout(() => uni.navigateBack(), 500);
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          });
        });
      }
    }
  }
</script>
