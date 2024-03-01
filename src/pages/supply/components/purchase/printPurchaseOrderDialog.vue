<template>
  <div>
    <t-dialog
      v-if="visible"
      v-model:visible="visible"
      :cancel-btn="null"
      :confirm-btn="null"
      header="打印采购单"
      show-overlay
      width="80%"
      @confirm="printDialog"
    >
      <div id="printDiv">
        <t-row>
          <t-col :span="12">
            <t-form layout="inline">
              <t-form-item label="采购单:" name="purchase_order_id">
                <t-input v-model="purchaseOrder.purchase_order_id" disabled />
              </t-form-item>
              <t-form-item label="供应商:" name="supplier_name">
                <t-input v-model="purchaseOrder.supplier_name" disabled />
              </t-form-item>
              <t-form-item label="采购日期:" name="purchase_date">
                <t-input v-model="purchaseOrder.purchase_date" disabled />
              </t-form-item>
            </t-form>
          </t-col>
        </t-row>
        <br />
        <div class="table-container">
          <t-table
            :bordered="true"
            :columns="skuTableColumns"
            :data="skuTableData"
            :rowspan-and-colspan="skuTableRowspanAndColspan"
            lazy-load
            resizable
            row-key="idx"
            table-layout="fixed"
          >
            <template #sku="{ row }">
              <t-space>
                <t-image :src="row.erp_sku_image_url" :style="{ width: '30px', height: '30px' }" />
                {{ row.sku }}
              </t-space>
            </template>
          </t-table>
        </div>
      </div>
      <br />
      <hr />
      <br />
      <t-button v-print="printSetting" style="float: right" theme="primary"> 打印</t-button>
    </t-dialog>
  </div>
</template>

<script lang="tsx">
export default {
  name: 'PrintPurchaseOrderDialog•',
};
</script>
<script lang="tsx" setup>
import { ref, defineExpose, defineEmits } from 'vue';
import { TableProps, DialogProps } from 'tdesign-vue-next';
import print from 'vue3-print-nb';
import { skuMap, loadSkuInfo } from '@/utils/skuUtil';

const vPrint = print;
const printSetting = ref({
  id: 'printDiv',
});

const skuTableData = ref([]);

const visible = ref(false);
const purchaseOrder = ref(null);
const skuTableColumns = [
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
    colKey: 'quantity',
    title: '采购数量',
    align: 'center',
  },
];

const getConfirmBtn: DialogProps['confirmBtn'] = () => {
  return (
    <t-button v-print="printSetting" theme="primary">
      打印
    </t-button>
  );
};

const popupDialog = async (pOrder: any) => {
  await loadSkuInfo();
  console.log(pOrder);
  purchaseOrder.value = pOrder;
  skuTableData.value = [];
  purchaseOrder.value.purchase_skus.forEach((item) => {
    const sku = skuMap.value.get(item.sku);
    skuTableData.value.push({
      idx: skuTableData.value.length + 1,
      sku_group: item.sku_group,
      sku_name: item.sku_name,
      sku: item.sku,
      erp_sku_image_url: sku.erp_sku_image_url,
      quantity: item.quantity,
    });
  });
  visible.value = true;
};

const skuTableRowspanAndColspan: TableProps['rowspanAndColspan'] = ({ col, rowIndex, colIndex }) => {
  if (colIndex !== 0) {
    return;
  }
  if (rowIndex > 0 && skuTableData.value[rowIndex - 1].sku_group === skuTableData.value[rowIndex].sku_group) {
    return;
  }
  // console.log(`skuTableRowspanAndColspan ${rowIndex}-${colIndex}: ${col}`);
  let rowspan = 1;
  for (let i = rowIndex + 1; i < skuTableData.value.length; i++) {
    if (skuTableData.value[i].sku_group === skuTableData.value[rowIndex].sku_group) {
      rowspan += 1;
    } else {
      break;
    }
  }
  if (rowspan <= 1) {
    return;
  }
  console.log(
    `skuTableRowspanAndColspan ${rowIndex}-${colIndex}`,
    {
      rowspan,
    },
    skuTableData.value,
  );
  return {
    rowspan,
  };
};
const printDialog = () => {};
defineExpose({ popupDialog });
</script>
<style scoped></style>
