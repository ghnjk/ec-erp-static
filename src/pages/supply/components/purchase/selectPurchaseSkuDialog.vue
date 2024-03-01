<template>
  <div>
    <t-dialog
      v-if="visible"
      v-model:visible="visible"
      :cancel-btn="null"
      :close-on-esc-keydown="false"
      :close-on-overlay-click="false"
      :confirm-btn="null"
      header="选择采购商品"
      show-overlay
      width="80%"
    >
      <t-row>
        <t-col :span="12">
          <t-form layout="inline">
            <t-form-item label="供应商:" name="supplierId">
              <t-select
                v-model="supplierId"
                :options="supplierIdOptions"
                filterable
                placeholder="-请选择供应商-"
                style="width: 200px; display: inline-block; margin: 0 20px 20px 0"
              />
            </t-form-item>
          </t-form>
        </t-col>
        <t-col :span="8">
          <t-form layout="inline">
            <t-form-item label="SKU分组:" name="skuGroupName">
              <t-select
                v-model="skuGroupName"
                :options="skuGroupNameOptions"
                filterable
                placeholder="-请选择SKU分组-"
                style="width: 200px; display: inline-block; margin: 0 20px 20px 0"
              />
            </t-form-item>
            <t-form-item>
              <t-space size="small" style="align-items: center">
                <t-button theme="default" @click="onAddSkuGroup">添加采购</t-button>
              </t-space>
            </t-form-item>
          </t-form>
        </t-col>
        <t-col :span="4">
          <h2>总金额：{{ currencyFormatter.format(totalAmount) }}</h2>
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
          <template #total_price="{ row }">
            {{ currencyFormatter.format(row.unit_price * row.quantity) }}
          </template>
          <template #sku="{ row }">
            <t-space>
              <t-image :src="row.erp_sku_image_url" :style="{ width: '30px', height: '30px' }" />
              {{ row.sku }}
            </t-space>
          </template>
        </t-table>
        <br />
        <t-row>
          <t-col :span="12">
            <t-form-item label="备注:" name="remark">
              <t-textarea
                v-model="remark"
                :autosize="{ minRows: 3, maxRows: 10 }"
                name="remark"
                placeholder="采购单备注"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row>
          <t-col :span="9"></t-col>
          <t-col :span="3">
            <t-space>
              <t-button style="float: right" theme="primary" @click="onSavePurchaseOrder">保存</t-button>
              <t-button style="float: right" theme="success" @click="onSubmitPurchaseOrder">
                > 提交：{{ getNextPurchaseAction(purchaseOrder?.purchase_step) }}
              </t-button>
            </t-space>
          </t-col>
        </t-row>
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SelectPurchaseSkuDialog',
};
</script>
<script lang="ts" setup>
import { ref, defineExpose, defineEmits } from 'vue';
import { TableProps, Input, InputNumber, MessagePlugin } from 'tdesign-vue-next';
import { skuGroupNameOptions, skuGroupMap, skuMap, loadSkuInfo } from '@/utils/skuUtil';
import { supplierIdOptions, loadSupplierInfo, getNextPurchaseAction } from '@/utils/supplierUtil';
import { querySkuPurchasePrice, savePurchaseOrder, submitPurchaseOrderAndNextStep } from '@/apis/supplierApis';

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
});

const visible = ref(false);
const purchaseOrder = ref(null);
const supplierId = ref(null);
const remark = ref('');
const skuGroupName = ref('');
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
    colKey: 'inventory',
    title: '库存',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'quantity',
    title: '数量',
    align: 'center',
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
      onEdited: (context) => {
        console.log(context);
        skuTableData.value.splice(context.rowIndex, 1, context.newRowData);
        calcTotalAmount();
      },
      // 校验规则，此处同 Form 表单。https://tdesign.tencent.com/vue-next/components/form
      rules: [
        {
          required: true,
          message: '不能为空',
        },
      ],
      // 默认是否为编辑状态
      defaultEditable: true,
    },
  },
  {
    width: 120,
    colKey: 'unit_price',
    title: '单价',
    align: 'center',
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
      onEdited: (context) => {
        console.log(context);
        skuTableData.value.splice(context.rowIndex, 1, context.newRowData);
        calcTotalAmount();
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
    colKey: 'total_price',
    title: '总价',
    align: 'center',
  },
];
const skuTableData = ref([]);
const totalAmount = ref(0.0);
const emit = defineEmits(['onOrderChange']);

const onAddSkuGroup = async () => {
  const skuList = skuGroupMap.value.get(skuGroupName.value);
  if (skuList !== null && skuList !== undefined) {
    for (let i = 0; i < skuList.length; i++) {
      const item = skuList[i];
      const req = {
        supplier_id: supplierId.value,
        sku: item.sku,
      };
      const purchasePrice = await querySkuPurchasePrice(req);
      skuTableData.value.push({
        idx: skuTableData.value.length + 1,
        sku_group: item.sku_group,
        sku_name: item.sku_name,
        sku: item.sku,
        erp_sku_image_url: item.erp_sku_image_url,
        inventory: item.inventory,
        quantity: 0,
        unit_price: purchasePrice.unit_price / 100.0,
      });
    }
  }
};

const popupDialog = async (pOrder: any) => {
  await loadSupplierInfo();
  await loadSkuInfo();
  if (pOrder !== null) {
    purchaseOrder.value = pOrder;
    supplierId.value = pOrder.supplier_id;
    remark.value = pOrder.remark;
    skuTableData.value = [];
    pOrder.purchase_skus.forEach((item) => {
      const sku = skuMap.value.get(item.sku);
      skuTableData.value.push({
        idx: skuTableData.value.length + 1,
        sku_group: item.sku_group,
        sku_name: item.sku_name,
        sku: item.sku,
        erp_sku_image_url: sku.erp_sku_image_url,
        inventory: sku.inventory,
        quantity: item.quantity,
        unit_price: item.unit_price / 100.0,
      });
    });
  } else {
    purchaseOrder.value = null;
    supplierId.value = null;
    remark.value = '';
    skuTableData.value = [];
  }
  calcTotalAmount();
  visible.value = true;
};
const calcTotalAmount = () => {
  totalAmount.value = 0;
  skuTableData.value.forEach((item) => {
    totalAmount.value += item.quantity * item.unit_price;
  });
};
const buildSubmitOrderReq = () => {
  let req: any = {};
  if (purchaseOrder.value === null) {
    req.purchase_order_id = -1;
    req.supplier_id = supplierId.value;
    req.purchase_step = '草稿';
    req.remark = remark.value;
  } else {
    req = purchaseOrder.value;
    req.supplier_id = supplierId.value;
    req.remark = remark.value;
  }
  req.purchase_skus = [];
  skuTableData.value.forEach((item) => {
    const s = JSON.parse(JSON.stringify(item));
    s.unit_price = Math.round(s.unit_price * 100.0);
    req.purchase_skus.push(s);
  });
  return req;
};
const onSubmitPurchaseOrder = async () => {
  if (supplierId.value <= 0) {
    await MessagePlugin.error('请先选择供应商');
    return;
  }
  const req = buildSubmitOrderReq();
  console.log(`onSubmitPurchaseOrder `, req);
  try {
    const res = await submitPurchaseOrderAndNextStep(req);
    console.log(res);
    visible.value = false;
    emit('onOrderChange');
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`保存采购单异常: ${e}`);
  }
};
const onSavePurchaseOrder = async () => {
  if (supplierId.value <= 0) {
    await MessagePlugin.error('请先选择供应商');
    return;
  }
  const req = buildSubmitOrderReq();
  console.log(`onSavePurchaseOrder `, req);
  try {
    const res = await savePurchaseOrder(req);
    console.log(res);
    visible.value = false;
    emit('onOrderChange');
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`保存采购单异常: ${e}`);
  }
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
defineExpose({ popupDialog });
</script>
<style scoped></style>
