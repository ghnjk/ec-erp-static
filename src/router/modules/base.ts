import Layout from '@/layouts/index.vue';
import DashboardIcon from '@/assets/assets-slide-dashboard.svg';
import { USER_ROLE_SUPPLIER } from '@/config/global';

export default [
  {
    path: '/supply',
    component: Layout,
    redirect: '/supply/supplierList',
    name: 'supply',
    group: 'supply',
    meta: { title: '供应链', icon: DashboardIcon, hidden: false },
    children: [
      {
        path: 'supplierList',
        name: 'supplierList',
        component: () => import('@/pages/supply/supplierList.vue'),
        meta: { title: '供应商', roleCode: [USER_ROLE_SUPPLIER] },
      },
      {
        path: 'skuList',
        name: 'skuList',
        component: () => import('@/pages/supply/skuList.vue'),
        meta: { title: '商品SKU', roleCode: [USER_ROLE_SUPPLIER] },
      },
      {
        path: 'skuPurchasePriceList',
        name: 'skuPurchasePriceList',
        component: () => import('@/pages/supply/skuPurchasePriceList.vue'),
        meta: { title: '采购价', roleCode: [USER_ROLE_SUPPLIER] },
      },
      {
        path: 'purchaseOrderList',
        name: 'purchaseOrderList',
        component: () => import('@/pages/supply/purchaseOrderList.vue'),
        meta: { title: '采购单', roleCode: [USER_ROLE_SUPPLIER] },
      },
      {
        path: 'test',
        name: 'test',
        component: () => import('@/pages/supply/components/purchase/test.vue'),
        meta: { title: '测试', roleCode: [USER_ROLE_SUPPLIER] },
      },
    ],
  },
];
