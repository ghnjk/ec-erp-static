import { ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { searchSku } from '@/apis/supplierApis';

// 所有sku信息
const allSkuList = ref([]);
// 所有skuGroup的options
export const skuGroupNameOptions = ref([]);
// 按group分组的sku <groupName, skuList>
export const skuGroupMap = ref(new Map<string, any[]>());
// sku map <sku, skuInfo>
export const skuMap = ref(new Map<string, any>());

export async function loadSkuInfo() {
  allSkuList.value = [];
  skuGroupNameOptions.value = [];
  skuGroupMap.value = new Map<string, any[]>();
  skuMap.value = new Map<string, any[]>();
  const req = {
    current_page: 1,
    page_size: 10000,
  };
  try {
    const res = await searchSku(req);
    allSkuList.value = res.list;
    new Set(res.list.map((item) => item.sku_group)).forEach((item) => {
      skuGroupNameOptions.value.push({
        label: item,
        value: item,
      });
    });
    res.list.forEach((item) => {
      skuMap.value.set(item.sku, item);
      const groupName = item.sku_group;
      if (skuGroupMap.value.has(groupName)) {
        skuGroupMap.value.get(groupName).push(item);
      } else {
        skuGroupMap.value.set(groupName, [item]);
      }
    });
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`查询sku异常: ${e}`);
  }
}
