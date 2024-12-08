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
                clearable
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
            <t-form-item label="支撑天数:" name="supportDays">
              <t-input-number v-model="queryParam.supportDays" theme="column"></t-input-number>
            </t-form-item>
            <t-form-item>
              <t-space size="small" style="align-items: center; margin-left: 30px">
                <t-button theme="primary" @click="onSearchSku">查询</t-button>
              </t-space>
              <t-space size="small" style="align-items: center; margin-left: 30px">
                <t-button theme="success" @click="popupAddSkuDialog">添加SKU</t-button>
              </t-space>
              <t-space size="small" style="align-items: center; margin-left: 30px">
                <t-button theme="default" variant="text" @click="onSyncAllSku">同步所有库存</t-button>
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
          :show-sort-column-bg-color="true"
          :sort="sortTable"
          bordered
          hover
          row-key="sku"
          stripe
          @sort-change="sortTableChange"
        >
          <template #avg_sell_quantity="{ row }">
            {{ row.avg_sell_quantity.toFixed(2) }}
          </template>
          <template #erp_sku_image_url="{ row }">
            <t-image :src="row.erp_sku_image_url" :style="{ width: '60px', height: '60px' }" />
          </template>
          <template #inventory_pkg="{ row }">
            {{ calcInventoryPkg(row) }}
          </template>
          <template #avg_sell_quantity_pkg="{ row }">
            {{ calcAvgSellQuantityPkg(row) }}
          </template>
          <template #shipping_stock_quantity_pkg="{ row }">
            {{ calcShippingStockQuantityPkg(row) }}
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
    <t-dialog
      v-if="addSkuDialog.visible"
      v-model:visible="addSkuDialog.visible"
      :cancel-btn="null"
      :close-on-esc-keydown="false"
      :close-on-overlay-click="false"
      :confirm-btn="null"
      header="添加SKU"
      show-overlay
      width="60%"
    >
      <t-alert message="需要提前在bigseller添加好sku" />
      <br />
      <t-form>
        <t-form-item label="sku:" name="supplier_name">
          <t-textarea
            v-model="addSkuDialog.skus"
            :autosize="{ minRows: 3, maxRows: 5 }"
            name="description"
            placeholder="需要添加的sku。多个换行"
          />
        </t-form-item>
      </t-form>
      <br />
      <t-row>
        <t-col :span="9"></t-col>
        <t-col :span="3">
          <t-space>
            <t-button style="float: right" theme="primary" @click="onAddSku">批量添加</t-button>
          </t-space>
        </t-col>
      </t-row>
    </t-dialog>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SkuList',
};
</script>
<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { MessagePlugin, InputNumber, Input, TableProps } from 'tdesign-vue-next';
import { saveSku, searchSku, syncAllSku, addSku } from '@/apis/supplierApis';
import { skuGroupNameOptions, loadSkuInfo } from '@/utils/skuUtil';

const queryParam = ref({
  skuGroup: '',
  skuName: '',
  sku: '',
  supportDays: '',
});
const sortTable = ref<TableProps['sort']>({
  sortBy: 'avg_sell_quantity',
  descending: true,
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
    // 编辑状态相关配置，全部集中在 edit
    edit: {
      // 1. 支持任意组件。需保证组件包含 `value` 和 `onChange` 两个属性，且 onChange 的第一个参数值为 new value。
      // 2. 如果希望支持校验，组件还需包含 `status` 和 `tips` 属性。具体 API 含义参考 Input 组件
      component: Input,
      // props, 透传全部属性到 Input 组件。可以是一个函数，不同行有不同的 props 属性 时，使用 Function）
      props: {
        autofocus: true,
      },
      // 触发校验的时机（when to validate)
      validateTrigger: 'change',
      // 除了点击非自身元素退出编辑态之外，还有哪些事件退出编辑态
      abortEditOnEvent: ['onEnter', 'onBlur'],
      // 编辑完成，退出编辑态后触发
      onEdited: async (context) => {
        console.log(context);
        await onSaveSku(context.newRowData);
        await onSearchSku();
      },
      // 校验规则，此处同 Form 表单。https://tdesign.tencent.com/vue-next/components/form
      rules: [
        {
          required: true,
          message: '不能为空',
        },
      ],
      // 默认是否为编辑状态
      defaultEditable: false,
    },
  },
  {
    width: 120,
    colKey: 'sku_name',
    title: '商品名',
    align: 'center',
    // 编辑状态相关配置，全部集中在 edit
    edit: {
      // 1. 支持任意组件。需保证组件包含 `value` 和 `onChange` 两个属性，且 onChange 的第一个参数值为 new value。
      // 2. 如果希望支持校验，组件还需包含 `status` 和 `tips` 属性。具体 API 含义参考 Input 组件
      component: Input,
      // props, 透传全部属性到 Input 组件。可以是一个函数，不同行有不同的 props 属性 时，使用 Function）
      props: {
        autofocus: true,
      },
      // 触发校验的时机（when to validate)
      validateTrigger: 'change',
      // 除了点击非自身元素退出编辑态之外，还有哪些事件退出编辑态
      abortEditOnEvent: ['onEnter', 'onBlur'],
      // 编辑完成，退出编辑态后触发
      onEdited: async (context) => {
        console.log(context);
        await onSaveSku(context.newRowData);
        await onSearchSku();
      },
      // 校验规则，此处同 Form 表单。https://tdesign.tencent.com/vue-next/components/form
      rules: [
        {
          required: true,
          message: '不能为空',
        },
      ],
      // 默认是否为编辑状态
      defaultEditable: false,
    },
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
    colKey: 'sku_unit_name',
    title: '采购单位',
    align: 'center',
    // 编辑状态相关配置，全部集中在 edit
    edit: {
      // 1. 支持任意组件。需保证组件包含 `value` 和 `onChange` 两个属性，且 onChange 的第一个参数值为 new value。
      // 2. 如果希望支持校验，组件还需包含 `status` 和 `tips` 属性。具体 API 含义参考 Input 组件
      component: Input,
      // props, 透传全部属性到 Input 组件。可以是一个函数，不同行有不同的 props 属性 时，使用 Function）
      props: {
        autofocus: true,
      },
      // 触发校验的时机（when to validate)
      validateTrigger: 'change',
      // 除了点击非自身元素退出编辑态之外，还有哪些事件退出编辑态
      abortEditOnEvent: ['onEnter', 'onBlur'],
      // 编辑完成，退出编辑态后触发
      onEdited: async (context) => {
        console.log(context);
        await onSaveSku(context.newRowData);
        await onSearchSku();
      },
      // 校验规则，此处同 Form 表单。https://tdesign.tencent.com/vue-next/components/form
      rules: [
        {
          required: true,
          message: '不能为空',
        },
      ],
      // 默认是否为编辑状态
      defaultEditable: false,
    },
  },
  {
    width: 120,
    colKey: 'sku_unit_quantity',
    title: '单位的SKU数',
    align: 'center',
    sortType: 'all',
    sorter: true,
    // 编辑状态相关配置，全部集中在 edit
    edit: {
      // 1. 支持任意组件。需保证组件包含 `value` 和 `onChange` 两个属性，且 onChange 的第一个参数值为 new value。
      // 2. 如果希望支持校验，组件还需包含 `status` 和 `tips` 属性。具体 API 含义参考 Input 组件
      component: InputNumber,
      // props, 透传全部属性到 Input 组件。可以是一个函数，不同行有不同的 props 属性 时，使用 Function）
      props: {
        autofocus: true,
      },
      // 触发校验的时机（when to validate)
      validateTrigger: 'change',
      // 除了点击非自身元素退出编辑态之外，还有哪些事件退出编辑态
      abortEditOnEvent: ['onEnter', 'onBlur'],
      // 编辑完成，退出编辑态后触发
      onEdited: async (context) => {
        console.log(context);
        await onSaveSku(context.newRowData);
        await onSearchSku();
      },
      // 校验规则，此处同 Form 表单。https://tdesign.tencent.com/vue-next/components/form
      rules: [
        {
          required: true,
          message: '不能为空',
        },
      ],
      // 默认是否为编辑状态
      defaultEditable: false,
    },
  },
  {
    width: 120,
    colKey: 'inventory',
    sortType: 'all',
    sorter: true,
    title: '库存-SKU',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'inventory_pkg',
    sortType: 'all',
    sorter: true,
    title: '库存-采购单位',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'avg_sell_quantity',
    title: '平均日销-SKU',
    align: 'center',
    sortType: 'all',
    sorter: true,
  },
  {
    width: 120,
    colKey: 'avg_sell_quantity_pkg',
    title: '平均日销-采购单位',
    align: 'center',
    sortType: 'all',
    sorter: true,
  },
  {
    width: 120,
    colKey: 'inventory_support_days',
    title: '库存支撑天数',
    align: 'center',
    sortType: 'all',
    sorter: true,
  },
  {
    width: 120,
    colKey: 'shipping_stock_quantity',
    title: '海运中-SKU',
    align: 'center',
    sortType: 'all',
    sorter: true,
  },
  {
    width: 120,
    colKey: 'shipping_stock_quantity_pkg',
    title: '海运中-采购单位',
    align: 'center',
    sortType: 'all',
    sorter: true,
  },
];
const skuTableData = ref([]);
const skuTableLoading = ref(false);
const paginationCurrentPage = ref(1);
const paginationTotalCount = ref(0);
const paginationPageSize = ref(10);
const paginationPageSizeOptions = [10, 20, 50, 100];
const addSkuDialog = ref({
  visible: false,
  skus: '',
});

onMounted(() => {
  onSearchSku();
  loadSkuInfo();
});
const sortTableChange: TableProps['onSortChange'] = (val) => {
  sortTable.value = val;
  onSearchSku();
};
const onPaginationChange = ({ current, pageSize }) => {
  paginationCurrentPage.value = current;
  paginationPageSize.value = pageSize;
  onSearchSku();
};
const calcAvgSellQuantityPkg = (row) => {
  if (row.sku_unit_quantity === null || row.sku_unit_quantity === undefined || row.sku_unit_quantity <= 0) {
    return row.avg_sell_quantity.toFixed(1);
  }
  const res = row.avg_sell_quantity / row.sku_unit_quantity;
  return res.toFixed(1);
};
const calcInventoryPkg = (row) => {
  if (row.sku_unit_quantity === null || row.sku_unit_quantity === undefined || row.sku_unit_quantity <= 0) {
    return row.inventory.toFixed(1);
  }
  const res = row.inventory / row.sku_unit_quantity;
  return res.toFixed(1);
};
const calcShippingStockQuantityPkg = (row) => {
  if (row.sku_unit_quantity === null || row.sku_unit_quantity === undefined || row.sku_unit_quantity <= 0) {
    return row.shipping_stock_quantity.toFixed(1);
  }
  const res = row.shipping_stock_quantity / row.sku_unit_quantity;
  return res.toFixed(1);
};
const onSaveSku = async (sku) => {
  try {
    await saveSku(sku);
    await MessagePlugin.success('更新sku成功。');
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`更新sku异常: ${e}`);
  }
};
const onAddSku = async () => {
  try {
    const { success_count, ignore_count, fail_count, detail } = await addSku({
      skus: addSkuDialog.value.skus,
    });
    console.log('onAddSku response', detail);
    await MessagePlugin.success(`成功添加：${success_count}, 失败：${fail_count}， 忽略： ${ignore_count}`);
    onSearchSku();
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`添加sku异常: ${e}`);
  }
};
const popupAddSkuDialog = () => {
  addSkuDialog.value.visible = true;
};
const onSyncAllSku = async () => {
  skuTableLoading.value = true;
  try {
    const { update_count } = await syncAllSku();
    await MessagePlugin.success(`成功同步${update_count}个sku`);
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`查询sku异常: ${e}`);
  }
  skuTableLoading.value = false;
};
const onSearchSku = async () => {
  const req = {
    sku_group: queryParam.value.skuGroup,
    sku_name: queryParam.value.skuName,
    sku: queryParam.value.sku,
    inventory_support_days: queryParam.value.supportDays,
    current_page: paginationCurrentPage.value,
    page_size: paginationPageSize.value,
    sort: sortTable.value,
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
