<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="name" label="商品名称" required>
        <uni-easyinput placeholder="商品名称" v-model="formData.name" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="mainImage" label="商品主图">
        <uni-file-picker file-mediatype="image" :limit="1" return-type="object" v-model="mainImageValue"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="images" label="商品图片">
        <uni-file-picker file-mediatype="image" :limit="9" return-type="array" v-model="imagesValue"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="price" label="售价" required>
        <uni-easyinput placeholder="商品售价" type="number" v-model="formData.price"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="originalPrice" label="原价">
        <uni-easyinput placeholder="商品原价" type="number" v-model="formData.originalPrice"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="specialPrice" label="特殊价格">
        <uni-easyinput placeholder="特殊价格" type="number" v-model="formData.specialPrice"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="categoryId" label="一级分类" required>
        <uni-data-select
          :localdata="parentCategoryOptions"
          v-model="formData.categoryId"
          placeholder="请选择一级分类"
          size="mini"
          @change="onParentCategoryChanged"
        ></uni-data-select>
      </uni-forms-item>
      <uni-forms-item name="subCategoryIds" label="二级分类">
        <uni-data-select
          :localdata="childPickerOptions"
          v-model="childSelectValue"
          placeholder="请先选择一级分类"
          size="mini"
          :disabled="!childPickerOptions.length"
        ></uni-data-select>
      </uni-forms-item>
      <uni-forms-item name="brand" label="品牌">
        <uni-data-select
          :localdata="brandOptions"
          v-model="formData.brand"
          placeholder="请选择品牌"
          size="mini"
        ></uni-data-select>
      </uni-forms-item>
      <uni-forms-item name="store_id" label="商户">
        <uni-data-select
          :localdata="storeOptions"
          v-model="formData.store_id"
          placeholder="请选择商户"
          size="mini"
        ></uni-data-select>
      </uni-forms-item>
      <uni-forms-item name="space_tags" label="适用空间">
        <uni-data-checkbox :multiple="true" v-model="formData.space_tags" :localdata="formOptions.space_tags_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="sellingPoints" label="核心卖点">
        <view class="array-inputs">
          <view class="array-row" v-for="(value, index) in sellingPointsEntries" :key="`selling-${index}`">
            <uni-easyinput placeholder="输入核心卖点" v-model="sellingPointsEntries[index]" trim="both"></uni-easyinput>
            <button class="array-remove" type="warn" size="mini" @click="removeSellingPoint(index)">删除</button>
          </view>
          <button class="uni-button" type="default" size="mini" @click="addSellingPoint">+ 添加核心卖点</button>
        </view>
      </uni-forms-item>
      <uni-forms-item name="description" label="商品描述">
        <uni-easyinput placeholder="商品详细描述" v-model="formData.description" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="isHot" label="热门商品">
        <switch @change="binddata('isHot', $event.detail.value)" :checked="formData.isHot"></switch>
      </uni-forms-item>
      <uni-forms-item name="isNew" label="新品">
        <switch @change="binddata('isNew', $event.detail.value)" :checked="formData.isNew"></switch>
      </uni-forms-item>
      <uni-forms-item name="stock" label="库存">
        <uni-easyinput placeholder="商品库存数量" type="number" v-model="formData.stock"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="sales" label="销量">
        <uni-easyinput placeholder="商品销量" type="number" v-model="formData.sales"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="状态" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="origin" label="发货地">
        <uni-easyinput placeholder="例如 广东省佛山市" v-model="formData.origin"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="rating" label="评分">
        <uni-easyinput placeholder="商品评分" type="number" v-model="formData.rating"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="promotion_tag" label="促销标签">
        <uni-easyinput placeholder="例如 超值特卖" v-model="formData.promotion_tag"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="promotion_desc" label="促销描述">
        <uni-easyinput placeholder="促销详情说明" v-model="formData.promotion_desc"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="freight_fee" label="运费">
        <uni-easyinput placeholder="按金额算" type="number" v-model="formData.freight_fee"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="install_fee" label="送装费">
        <uni-easyinput placeholder="按金额算" type="number" v-model="formData.install_fee"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="service_tags" label="服务保障">
        <view class="array-inputs">
          <view class="array-row" v-for="(value, index) in serviceTagsEntries" :key="`service-${index}`">
            <uni-easyinput placeholder="输入服务保障" v-model="serviceTagsEntries[index]" trim="both"></uni-easyinput>
            <button class="array-remove" type="warn" size="mini" @click="removeServiceTag(index)">删除</button>
          </view>
          <button class="uni-button" type="default" size="mini" @click="addServiceTag">+ 添加服务保障</button>
        </view>
      </uni-forms-item>
      <uni-forms-item name="materials" label="材质简要">
        <uni-easyinput v-model="formData.materials"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="dimensions" label="尺寸简要">
        <uni-easyinput v-model="formData.dimensions"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="specs" label="规格参数组">
        <view class="array-inputs spec-inputs">
          <view class="spec-row" v-for="(entry, index) in specEntries" :key="`spec-${index}`">
            <uni-easyinput class="spec-input" placeholder="参数名称" v-model="specEntries[index].label" trim="both"></uni-easyinput>
            <uni-easyinput class="spec-input" placeholder="参数值" v-model="specEntries[index].value" trim="both"></uni-easyinput>
            <button class="array-remove" type="warn" size="mini" @click="removeSpec(index)">删除</button>
          </view>
          <button class="uni-button" type="default" size="mini" @click="addSpec">+ 添加参数</button>
        </view>
      </uni-forms-item>
      <uni-forms-item name="pointItems" label="产品卖点介绍列表">
        <view class="array-inputs">
          <view class="array-row" v-for="(value, index) in pointItemsEntries" :key="`point-${index}`">
            <uni-easyinput placeholder="输入产品卖点" v-model="pointItemsEntries[index]" trim="both"></uni-easyinput>
            <button class="array-remove" type="warn" size="mini" @click="removePointItem(index)">删除</button>
          </view>
          <button class="uni-button" type="default" size="mini" @click="addPointItem">+ 添加卖点</button>
        </view>
      </uni-forms-item>
      <uni-forms-item name="detailImages" label="商品详情长图说明">
        <uni-file-picker file-mediatype="image" :limit="8" return-type="array" v-model="detailImagesValue"></uni-file-picker>
        <view class="multi-preview" v-if="detailImagePreviewUrls.length">
          <image v-for="(url, index) in detailImagePreviewUrls" :key="`detail-preview-${index}`" :src="url" mode="aspectFill"></image>
        </view>
      </uni-forms-item>
      <uni-forms-item name="serviceImages" label="服务保障长图说明">
        <uni-file-picker file-mediatype="image" :limit="8" return-type="array" v-model="serviceImagesValue"></uni-file-picker>
        <view class="multi-preview" v-if="serviceImagePreviewUrls.length">
          <image v-for="(url, index) in serviceImagePreviewUrls" :key="`service-preview-${index}`" :src="url" mode="aspectFill"></image>
        </view>
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
  import { validator } from '../../../js_sdk/validator/product.js';

  const db = uniCloud.database();
  const dbCollectionName = 'product';

  function getValidator(fields) {
    const result = {};
    for (const key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key];
      }
    }
    return result;
  }

  export default {
    data() {
      const formData = {
        name: '',
        mainImage: '',
        images: [],
        price: null,
        originalPrice: null,
        specialPrice: null,
        categoryId: '',
        subCategoryIds: [],
        brand: '',
        store_id: '',
        space_tags: [],
        sellingPoints: [],
        description: '',
        isHot: false,
        isNew: true,
        stock: 0,
        sales: 0,
        status: 1,
        origin: '',
        rating: null,
        promotion_tag: '',
        promotion_desc: '',
        freight_fee: null,
        install_fee: null,
        service_tags: [],
        materials: '',
        dimensions: '',
        specs: [],
        pointItems: [],
        detailImages: [],
        serviceImages: []
      };
      return {
        formData,
        formDataId: '',
        mainImageValue: null,
        imagesValue: [],
        detailImagesValue: [],
        serviceImagesValue: [],
        sellingPointsEntries: [],
        serviceTagsEntries: [],
        pointItemsEntries: [],
        specEntries: [],
        parentCategoryOptions: [],
        childOptionsByParent: {},
        currentChildOptions: [],
        brandOptions: [],
        storeOptions: [],
        formOptions: {
          space_tags_localdata: [
            { value: '精选', text: '精选' },
            { value: '客厅', text: '客厅' },
            { value: '餐厅', text: '餐厅' },
            { value: '卧室', text: '卧室' },
            { value: '儿童房', text: '儿童房' },
            { value: '书房', text: '书房' },
            { value: '灯饰', text: '灯饰' },
            { value: '卫浴', text: '卫浴' }
          ],
          status_localdata: [
            { value: 0, text: '下架' },
            { value: 1, text: '上架' }
          ]
        },
        rules: {
          ...getValidator(Object.keys(formData))
        }
      };
    },
    computed: {
      childPickerOptions() {
        return (this.currentChildOptions || []).map(child => ({
          value: child.id,
          text: child.name
        }));
      },
      childSelectValue: {
        get() {
          return (this.formData.subCategoryIds && this.formData.subCategoryIds[0]) || '';
        },
        set(value) {
          this.formData.subCategoryIds = value ? [value] : [];
        }
      },
      detailImagePreviewUrls() {
        return (this.detailImagesValue || []).map(file => file.url).filter(Boolean);
      },
      serviceImagePreviewUrls() {
        return (this.serviceImagesValue || []).map(file => file.url).filter(Boolean);
      }
    },
    onLoad(e) {
      this.initDynamicFields();
      const categoryPromise = this.loadCategoryOptions();
      this.loadBrandOptions();
      this.loadStoreOptions();
      if (e && e.id) {
        this.formDataId = e.id;
        categoryPromise.finally(() => {
          this.getDetail(e.id);
        });
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules);
    },
    methods: {
      binddata(field, value) {
        this.formData[field] = value;
      },
      onParentCategoryChanged(event) {
        const value = event && event.detail ? event.detail.value : event;
        this.formData.categoryId = value || '';
        this.formData.subCategoryIds = [];
        this.updateCurrentChildOptions(this.formData.categoryId);
      },
      ensureParentSelection() {
        let parentId = this.formData.categoryId;
        if (parentId && !this.parentCategoryOptions.some(opt => opt.value === parentId)) {
          parentId = '';
        }
        if (!parentId && this.parentCategoryOptions.length) {
          parentId = this.parentCategoryOptions[0].value;
        }
        this.formData.categoryId = parentId;
        this.updateCurrentChildOptions(parentId);
      },
      updateCurrentChildOptions(parentId) {
        this.currentChildOptions = parentId ? (this.childOptionsByParent[parentId] || []) : [];
        const validIds = new Set(this.currentChildOptions.map(option => option.id));
        this.formData.subCategoryIds = this.formData.subCategoryIds.filter(id => validIds.has(id));
      },
      loadCategoryOptions() {
        return db.collection('category').field('_id,name,parentId,level').orderBy('sort', 'asc').get().then((res) => {
          const list = (res.result && res.result.data) || [];
          const parentMap = {};
          const parents = [];
          list.forEach((item) => {
            if (item.level === 1) {
              const name = item.name || '';
              parentMap[item._id] = name;
              parents.push({
                value: item._id,
                text: name
              });
            }
          });
          const childOptions = {};
          const fallbackId = '__fallback';
          let fallbackUsed = false;
          list.forEach((item) => {
            if (item.level === 2) {
              let parentId = item.parentId;
              if (!parentId || !parentMap[parentId]) {
                parentId = fallbackId;
                fallbackUsed = true;
              }
              const optionName = item.name || '';
              if (!childOptions[parentId]) {
                childOptions[parentId] = [];
              }
              childOptions[parentId].push({
                id: item._id,
                name: optionName
              });
            }
          });
          if (fallbackUsed) {
            parents.push({
              value: fallbackId,
              text: '其他'
            });
          }
          this.parentCategoryOptions = parents;
          this.childOptionsByParent = childOptions;
          this.ensureParentSelection();
        });
      },
      addSellingPoint() {
        this.sellingPointsEntries.push('');
      },
      removeSellingPoint(index) {
        this.sellingPointsEntries.splice(index, 1);
      },
      addServiceTag() {
        this.serviceTagsEntries.push('');
      },
      removeServiceTag(index) {
        this.serviceTagsEntries.splice(index, 1);
      },
      addPointItem() {
        this.pointItemsEntries.push('');
      },
      removePointItem(index) {
        this.pointItemsEntries.splice(index, 1);
      },
      addSpec() {
        this.specEntries.push({ label: '', value: '' });
      },
      removeSpec(index) {
        this.specEntries.splice(index, 1);
      },
      loadBrandOptions() {
        return db.collection('brand').field('_id,name').orderBy('sort', 'asc').get().then((res) => {
          const list = (res.result && res.result.data) || [];
          this.brandOptions = list.map((item) => ({
            value: item._id,
            text: item.name || ''
          }));
        });
      },
      loadStoreOptions() {
        return db.collection('store').field('_id,name').orderBy('name', 'asc').get().then((res) => {
          const list = (res.result && res.result.data) || []
          this.storeOptions = list
            .filter(item => item && item._id)
            .map((item) => ({
              value: item._id,
              text: item.name || ''
            }))
        });
      },
      initDynamicFields() {
        this.sellingPointsEntries = Array.isArray(this.formData.sellingPoints) && this.formData.sellingPoints.length ? [...this.formData.sellingPoints] : [''];
        this.serviceTagsEntries = Array.isArray(this.formData.service_tags) && this.formData.service_tags.length ? [...this.formData.service_tags] : [''];
        this.pointItemsEntries = Array.isArray(this.formData.pointItems) && this.formData.pointItems.length ? [...this.formData.pointItems] : [''];
        const specs = Array.isArray(this.formData.specs) ? this.formData.specs : [];
        if (specs.length) {
          this.specEntries = specs.map((item) => ({
            label: typeof item === 'object' ? (item.label || item.name || '') : (item || ''),
            value: typeof item === 'object' ? (item.value || item.val || '') : ''
          }));
        } else {
          this.specEntries = [{ label: '', value: '' }];
        }
        this.initFileFields();
      },
      initFileFields() {
        this.imagesValue = (this.formData.images || []).map((url, index) => ({
          url,
          extname: '',
          name: `image_${index}`
        }));
        this.detailImagesValue = (this.formData.detailImages || []).map((url, index) => ({
          url,
          extname: '',
          name: `detail_${index}`
        }));
        this.serviceImagesValue = (this.formData.serviceImages || []).map((url, index) => ({
          url,
          extname: '',
          name: `service_${index}`
        }));
      },
      syncArrayFields() {
        this.formData.sellingPoints = this.sellingPointsEntries.filter(item => item && item.trim());
        this.formData.service_tags = this.serviceTagsEntries.filter(item => item && item.trim());
        this.formData.pointItems = this.pointItemsEntries.filter(item => item && item.trim());
        this.formData.specs = this.specEntries
          .filter(entry => (entry.label && entry.label.trim()) || (entry.value && entry.value.trim()))
          .map(entry => ({
            label: entry.label.trim(),
            value: entry.value.trim()
          }));
      },
      syncFileFields() {
        this.formData.images = (this.imagesValue || []).map(file => file.url).filter(Boolean);
        this.formData.detailImages = (this.detailImagesValue || []).map(file => file.url).filter(Boolean);
        this.formData.serviceImages = (this.serviceImagesValue || []).map(file => file.url).filter(Boolean);
      },
      submit() {
        uni.showLoading({
          mask: true
        });
        this.formData.mainImage = this.mainImageValue && this.mainImageValue.url ? this.mainImageValue.url : '';
        this.syncArrayFields();
        this.syncFileFields();
        this.$refs.form.validate().then(() => {
          return this.submitForm({ ...this.formData });
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading();
        });
      },
      submitForm(value) {
        if (!this.formDataId) {
          uni.showToast({ title: '缺少商品ID', icon: 'none' });
          return Promise.resolve();
        }
        const updateValue = { ...value };
        delete updateValue._id;
        // 确保数字字段为正确类型，防止数据库验证失败
        updateValue.stock = parseInt(updateValue.stock, 10) || 0
        updateValue.sales = parseInt(updateValue.sales, 10) || 0
        updateValue.status = parseInt(updateValue.status, 10) || 1
        updateValue.price = parseFloat(updateValue.price) || 0
        if (updateValue.originalPrice) updateValue.originalPrice = parseFloat(updateValue.originalPrice)
        if (updateValue.specialPrice) updateValue.specialPrice = parseFloat(updateValue.specialPrice)
        if (updateValue.freight_fee) updateValue.freight_fee = parseFloat(updateValue.freight_fee)
        if (updateValue.install_fee) updateValue.install_fee = parseFloat(updateValue.install_fee)
        if (updateValue.rating) updateValue.rating = parseFloat(updateValue.rating)
        return db.collection(dbCollectionName).doc(this.formDataId).update(updateValue).then(() => {
          uni.showToast({
            title: '修改成功'
          });
          this.getOpenerEventChannel().emit('refreshData');
          setTimeout(() => uni.navigateBack(), 500);
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          });
        });
      },
      getDetail(id) {
        if (!id) {
          return;
        }
        uni.showLoading({
          mask: true
        });
        db.collection(dbCollectionName).doc(id).field("name,mainImage,images,price,originalPrice,specialPrice,categoryId,subCategoryIds,brand,store_id,space_tags,sellingPoints,description,isHot,isNew,stock,sales,status,origin,rating,promotion_tag,promotion_desc,freight_fee,install_fee,service_tags,materials,dimensions,specs,pointItems,detailImages,serviceImages").get().then((res) => {
          const data = (res.result && res.result.data && res.result.data[0]) || null;
          if (data) {
            this.formData = {
              ...this.formData,
              ...data
            };
            this.initDynamicFields();
            this.updateCurrentChildOptions(this.formData.categoryId);
            this.mainImageValue = data.mainImage ? { url: data.mainImage, extname: '', name: 'main' } : null;
          }
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          });
        }).finally(() => {
          uni.hideLoading();
        });
      }
    }
  };
</script>

<style>
.array-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.array-row {
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  gap: 8px;
  align-items: center;
}
.array-row uni-easyinput {
  flex: 1;
}
.array-remove {
  margin-left: auto;
}
.spec-inputs {
  gap: 10px;
}
.spec-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.spec-input {
  flex: 1;
  min-width: 40%;
}
.multi-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.multi-preview image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
</style>