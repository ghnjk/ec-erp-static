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
// 数据是否已加载
export const skuInfoLoaded = ref(false);
// 正在加载的Promise（防止重复加载）
let loadingPromise: Promise<void> | null = null;

export async function loadSkuInfo() {
  // 如果正在加载，返回加载中的Promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // 如果已加载，直接返回
  if (skuInfoLoaded.value) {
    return Promise.resolve();
  }

  loadingPromise = (async () => {
    allSkuList.value = [];
    skuGroupNameOptions.value = [];
    skuGroupMap.value = new Map<string, any[]>();
    skuMap.value = new Map<string, any[]>();
    skuInfoLoaded.value = false;
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
    
    // 标记为已加载
    skuInfoLoaded.value = true;
  } catch (e) {
    console.error(e);
    await MessagePlugin.error(`查询sku异常: ${e}`);
  } finally {
    loadingPromise = null;
  }
  })();

  return loadingPromise;
}
