<template>
  <div>
    <t-card>
      <t-row>
        <t-col :span="12">
          <t-form layout="inline">
            <t-form-item label="供应商:" name="supplier_name">
              <t-input v-model="queryParam.supplier_name" placeholder="供应商" />
            </t-form-item>
            <t-form-item label="采购进度:" name="purchase_state">
              <t-input v-model="queryParam.purchase_state" placeholder="采购进度" />
            </t-form-item>
            <t-form-item label="国内港口:" name="maritime_port">
              <t-input v-model="queryParam.maritime_port" placeholder="国内港口" />
            </t-form-item>
            <t-form-item>
              <t-space size="small" style="align-items: center; margin-left: 30px">
                <t-button theme="primary" @click="onSearchOrder">查询</t-button>
                <t-button theme="success" @click="onCreatePurchaseOrder">新建采购</t-button>
              </t-space>
            </t-form-item>
          </t-form>
        </t-col>
      </t-row>
      <br />
      <div class="table-container">
        <t-table
          :columns="orderTableColumns"
          :data="orderTableData"
          :loading="orderTableLoading"
          bordered
          hover
          row-key="purchase_order_id"
          stripe
        >
          <template #sku_amount="{ row }">
            {{ currencyFormatter.format(row.sku_amount / 100.0) }}
          </template>
          <template #pay_amount="{ row }">
            {{ currencyFormatter.format(row.pay_amount / 100.0) }}
          </template>
          <template #pay_state="{ row }">
            {{ row.pay_state === 1 ? '已支付: \n' + currencyFormatter.format(row.pay_amount / 100.0) : '待支付' }}
          </template>
          <template #op="{ row }">
            <t-button
              v-if="row.purchase_step !== '完成'"
              size="small"
              theme="primary"
              variant="text"
              @click="popupEditDialog(row)"
            >
              {{ getNextPurchaseAction(row.purchase_step) }}
            </t-button>
            <t-button
              v-if="row.purchase_step !== '草稿'"
              size="small"
              theme="default"
              variant="text"
              @click="popupPrintPurchaseOrderDialog(row)"
            >
              打印
            </t-button>
            <t-button
              v-if="row.purchase_step !== '草稿' && row.pay_state === 0"
              size="small"
              theme="success"
              variant="text"
              @click="popupPayOrderDialog(row)"
            >
              支付
            </t-button>
            <t-popconfirm
              v-if="row.purchase_step !== '草稿' && row.purchase_step !== '完成'"
              content="是否确认将该订单修改到上一步状态？"
              theme="danger"
              @confirm="goPreStep(row)"
            >
              <t-button size="small" theme="danger" variant="text">上一步</t-button>
            </t-popconfirm>
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
    <select-purchase-sku-dialog ref="selectPurchaseSkuDialog" @onOrderChange="onSearchOrder()" />
    <input-shipping-dialog ref="inputShippingDialog" @onOrderChange="onSearchOrder()" />
    <check-in-ware-house-dialog ref="checkInWareHouseDialog" @onOrderChange="onSearchOrder()" />
    <print-purchase-order-dialog ref="printPurchaseOrderDialog" />
    <pay-dialog ref="payDialog" @onOrderChange="onSearchOrder()" />
  </div>
</template>

<script lang="ts">
import SelectPurchaseSkuDialog from './components/purchase/selectPurchaseSkuDialog.vue';
import InputShippingDialog from './components/purchase/inputShippingDialog.vue';
import CheckInWareHouseDialog from './components/purchase/checkInWareHouseDialog.vue';
import PrintPurchaseOrderDialog from './components/purchase/printPurchaseOrderDialog.vue';
import PayDialog from './components/purchase/payDialog.vue';

export default {
  name: 'PurchaseOrderList',
  components: {
    SelectPurchaseSkuDialog,
    InputShippingDialog,
    CheckInWareHouseDialog,
    PrintPurchaseOrderDialog,
    PayDialog,
  },
};
</script>
<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { searchPurchaseOrder, savePurchaseOrder, submitPurchaseOrderAndNextStep } from '@/apis/supplierApis';
import { Textarea, MessagePlugin } from 'tdesign-vue-next';
import { getNextPurchaseAction, getPurchaseOrderPreState } from '@/utils/supplierUtil';

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
});
const orderTableColumns = [
  {
    width: 40,
    colKey: 'purchase_order_id',
    title: '采购单',
    align: 'center',
  },
  {
    width: 60,
    colKey: 'supplier_name',
    title: '供应商',
    align: 'center',
  },
  {
    width: 60,
    colKey: 'purchase_date',
    title: '采购日期',
    align: 'center',
  },
  {
    width: 60,
    colKey: 'purchase_step',
    title: '采购进度',
    align: 'center',
  },
  {
    width: 40,
    colKey: 'shipping_company',
    title: '海运公司',
    align: 'center',
  },
  {
    width: 60,
    colKey: 'expect_arrive_warehouse_date',
    title: '预计到货日期',
    align: 'center',
  },
  {
    width: 80,
    colKey: 'sku_amount',
    title: 'sku总价',
    align: 'center',
  },
  {
    width: 80,
    colKey: 'pay_state',
    title: '支付状态',
    align: 'center',
  },
  {
    width: 120,
    colKey: 'remark',
    title: '备注',
    align: 'center',
    // 编辑状态相关配置，全部集中在 edit
    edit: {
      // 1. 支持任意组件。需保证组件包含 `value` 和 `onChange` 两个属性，且 onChange 的第一个参数值为 new value。
      // 2. 如果希望支持校验，组件还需包含 `status` 和 `tips` 属性。具体 API 含义参考 Input 组件
      component: Textarea,
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
        await savePurchaseOrder(context.newRowData);
        await onSearchOrder();
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
    width: 100,
    colKey: 'op',
    title: '操作',
    align: 'center',
  },
];
const orderTableData = ref([]);
const orderTableLoading = ref(false);
const paginationCurrentPage = ref(1);
const paginationTotalCount = ref(0);
const paginationPageSize = ref(10);
const paginationPageSizeOptions = [10, 20, 50, 100];
const queryParam = ref({
  supplier_name: '',
  purchase_state: '',
  maritime_port: '',
});
const selectPurchaseSkuDialog = ref(null);
const inputShippingDialog = ref(null);
const checkInWareHouseDialog = ref(null);
const printPurchaseOrderDialog = ref(null);
const payDialog = ref(null);

onMounted(() => {
  onSearchOrder();
});

const onPaginationChange = ({ current, pageSize }) => {
  paginationCurrentPage.value = current;
  paginationPageSize.value = pageSize;
  onSearchOrder();
};
const onSearchOrder = async () => {
  const req = {
    current_page: paginationCurrentPage.value,
    page_size: paginationPageSize.value,
  };
  orderTableLoading.value = true;
  try {
    const res = await searchPurchaseOrder(req);
    paginationTotalCount.value = res.total;
    orderTableData.value = res.list;
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`查询订单异常: ${e}`);
  }
  orderTableLoading.value = false;
};
const onCreatePurchaseOrder = () => {
  selectPurchaseSkuDialog.value.popupDialog(null);
};
const syncSkuToErp = async (order) => {
  orderTableLoading.value = true;
  try {
    await submitPurchaseOrderAndNextStep(order);
    await onSearchOrder();
  } catch (e) {
    console.log(`同步ERP异常:${e}`);
    await MessagePlugin.error(`同步ERP异常:${e}`);
  }
};
const popupEditDialog = async (order) => {
  console.log(`当前状态： ${order.purchase_step}`);
  if (order.purchase_step === '草稿' || order.purchase_step === '供应商捡货中') {
    selectPurchaseSkuDialog.value.popupDialog(order);
  } else if (order.purchase_step === '待发货') {
    inputShippingDialog.value.popupDialog(order);
  } else if (order.purchase_step === '海运中') {
    checkInWareHouseDialog.value.popupDialog(order);
  } else if (order.purchase_step === '已入库') {
    await syncSkuToErp(order);
  }
};
const popupPrintPurchaseOrderDialog = (order) => {
  printPurchaseOrderDialog.value.popupDialog(order);
};
const popupPayOrderDialog = (order) => {
  payDialog.value.popupDialog(order);
};
const goPreStep = async (order) => {
  const state = getPurchaseOrderPreState(order.purchase_step);
  if (state === null) {
    return;
  }
  order.purchase_step = state;
  await savePurchaseOrder(order);
  await onSearchOrder();
};
</script>

<style lang="less" scoped></style>
