import Layout from '@/layouts/index.vue';
import DashboardIcon from '@/assets/assets-slide-dashboard.svg';
import FormIcon from '@/assets/assets-slide-form.svg';

import { USER_ROLE_SUPPLIER } from '@/config/global';

export default [
  {
    path: '/supply',
    component: Layout,
    redirect: '/supply/supplierList',
    name: 'supply',
    group: 'supply',
    meta: { title: '供应链', icon: FormIcon, hidden: false },
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
    ],
  },
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/shopSale',
    name: 'dashboard',
    group: 'dashboard',
    meta: { title: '销售报表', icon: DashboardIcon, hidden: false },
    children: [
      {
        path: 'shopSale',
        name: 'shopSale',
        component: () => import('@/pages/dashboard/shopSale.vue'),
        meta: { title: '店铺销售报表', roleCode: [USER_ROLE_SUPPLIER] },
      },
      {
        path: 'skuSale',
        name: 'skuSale',
        component: () => import('@/pages/dashboard/skuSale.vue'),
        meta: { title: '商品销售报表', roleCode: [USER_ROLE_SUPPLIER] },
      },
    ],
  },
];
