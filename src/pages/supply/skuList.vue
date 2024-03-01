<template>
  <div>
    <t-card>
      <t-row>
        <t-col :span="12">
          <t-form layout="inline">
            <t-form-item label="sku分组:" name="skuGroup">
              <t-select
                v-model="queryParam.skuGroup"
                :options="skuGroupNameOptions"
                filterable
                placeholder="-请选择商品分组-"
                style="width: 150px; display: inline-block"
              />
            </t-form-item>
            <t-form-item label="商品名:" name="skuName">
              <t-input v-model="queryParam.skuName" placeholder="商品名" />
            </t-form-item>
            <t-form-item label="商品SKU:" name="sku">
              <t-input v-model="queryParam.sku" placeholder="商品SKU" />
            </t-form-item>
            <t-form-item>
              <t-space size="small" style="align-items: center; margin-left: 30px">
                <t-button theme="primary" @click="onSearchSku">查询</t-button>
              </t-space>
            </t-form-item>
          </t-form>
        </t-col>
      </t-row>
      <br />
      <div class="table-container">
        <t-table
          :columns="skuTableColumns"
          :data="skuTableData"
          :loading="skuTableLoading"
          bordered
          hover
          row-key="sku"
          stripe
        >
          <template #erp_sku_image_url="{ row }">
            <t-image :src="row.erp_sku_image_url" :style="{ width: '60px', height: '60px' }" />
          </template>
        </t-table>
        <t-pagination
          v-model="paginationCurrentPage"
          v-model:pageSize="paginationPageSize"
          :page-size-options="paginationPageSizeOptions"
          :total="paginationTotalCount"
          class="pagination"
          @change="onPaginationChange"
        />
      </div>
    </t-card>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SkuList',
};
</script>
<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { searchSku } from '@/apis/supplierApis';
import { skuGroupNameOptions, loadSkuInfo } from '@/utils/skuUtil';

const queryParam = ref({
  skuGroup: '',
  skuName: '',
  sku: '',
});

const skuTableColumns = [
  {
    width: 60,
    colKey: 'erp_sku_image_url',
    title: '商品图片',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'sku_group',
    title: 'sku分组',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'sku_name',
    title: '商品名',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'sku',
    title: '商品SKU',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'erp_sku_name',
    title: 'BigSeller商品名',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'inventory',
    title: '库存',
    align: 'center',
  },
];
const skuTableData = ref([]);
const skuTableLoading = ref(false);
const paginationCurrentPage = ref(1);
const paginationTotalCount = ref(0);
const paginationPageSize = ref(10);
const paginationPageSizeOptions = [10, 20, 50, 100];

onMounted(() => {
  onSearchSku();
  loadSkuInfo();
});

const onPaginationChange = ({ current, pageSize }) => {
  paginationCurrentPage.value = current;
  paginationPageSize.value = pageSize;
  onSearchSku();
};
const onSearchSku = async () => {
  const req = {
    sku_group: queryParam.value.skuGroup,
    sku_name: queryParam.value.skuName,
    sku: queryParam.value.sku,
    current_page: paginationCurrentPage.value,
    page_size: paginationPageSize.value,
  };
  skuTableLoading.value = true;
  try {
    const res = await searchSku(req);
    paginationTotalCount.value = res.total;
    skuTableData.value = res.list;
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`查询sku异常: ${e}`);
  }
  skuTableLoading.value = false;
};
</script>

<style lang="less" scoped></style>