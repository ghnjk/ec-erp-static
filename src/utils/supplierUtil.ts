import { ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { searchSupplier } from '@/apis/supplierApis';

// 所有供应商信息
export const allSuppliers = ref([]);
// 供应商options
export const supplierIdOptions = ref([]);

export async function loadSupplierInfo() {
  allSuppliers.value = [];
  supplierIdOptions.value = [];
  const req = {
    current_page: 1,
    page_size: 10000,
  };
  try {
    const res = await searchSupplier(req);
    allSuppliers.value = res.list;
    res.list.forEach((item) => {
      supplierIdOptions.value.push({
        label: item.supplier_name,
        value: item.supplier_id,
      });
    });
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`查询供应商异常: ${e}`);
  }
}

/**
 *     采购流程图：
 *     草稿 -- 选择采购物品，提交采购单 -->
 *     供应商捡货中 -- 厂家提供采购清单，采购单确认 -->
 *     待发货 -- 厂家发货，填写海运公司，填写港口，填写海运费， 预计到达日期 --> *     海运中 -- 抵达海外仓库，点货入库 -->
 *     已入库 -- 同步erp -->
 *     完成
 * @param currentStep
 */
export function getNextPurchaseAction(currentStep) {
  if (currentStep === null || currentStep === undefined || currentStep === '草稿') {
    return '选购';
  }
  if (currentStep === '供应商捡货中') {
    return '采购单确认';
  }
  if (currentStep === '待发货') {
    return '发货';
  }
  if (currentStep === '海运中') {
    return '点货入库';
  }
  if (currentStep === '已入库') {
    return '同步erp';
  }
  return '下一步';
}

export function getPurchaseOrderPreState(currentStep) {
  if (currentStep === null || currentStep === undefined || currentStep === '草稿') {
    return null;
  }
  if (currentStep === '供应商捡货中') {
    return '草稿';
  }
  if (currentStep === '待发货') {
    return '供应商捡货中';
  }
  if (currentStep === '海运中') {
    return '待发货';
  }
  if (currentStep === '已入库') {
    return '海运中';
  }
  return null;
}
