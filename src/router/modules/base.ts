import Layout from '@/layouts/index.vue';
import DashboardIcon from '@/assets/assets-slide-dashboard.svg';
import { USER_ROLE_DEV, USER_ROLE_OPS } from '@/config/global';

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
        meta: { title: '供应商信息', roleCode: [USER_ROLE_OPS, USER_ROLE_DEV] },
      },
    ],
  },
];
