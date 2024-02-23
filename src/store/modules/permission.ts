import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';
import { DialogPlugin } from 'tdesign-vue-next';
import NProgress from 'nprogress'; // progress bar
import router, { asyncRouterList } from '@/router';
import type { IRole } from '@/store';
import { store } from '@/store';
import { getConstantStore } from '@/store/modules/constant';

function filterPermissionsRouters(routes: Array<RouteRecordRaw>, roleIds: Array<number>) {
  const res = [];
  const removeRoutes = [];
  routes.forEach((route) => {
    const secondChildren = [];
    route.children?.forEach((secondRoute) => {
      // const roleCode = childRouter.meta?.roleCode || childRouter.name;
      const thirdChildren = [];
      // 获取三级路由的权限
      (secondRoute?.children as Array<RouteRecordRaw>)?.forEach((thirdRoute) => {
        // 获取三级路由 `roleCode` 字段
        const thirdRoleCode: Array<number> = (thirdRoute.meta?.roleCode ?? []) as Array<number>;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        if (roleIds.some((r) => thirdRoleCode.includes(r))) thirdChildren.push(thirdRoute);
      });
      // 如果三级路由权限获取为空，那么获取二级路由
      if (thirdChildren.length === 0) {
        // 获取二级路由 `roleCode` 字段
        const secondRoleCode: Array<number> = (secondRoute.meta?.roleCode ?? []) as Array<number>;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        if (roleIds.some((r) => secondRoleCode.includes(r))) secondChildren.push(secondRoute);
        else removeRoutes.push(secondRoute);
      } else {
        // 将二级路由的children重新赋值为有权限的三级路由
        secondRoute.children = thirdChildren;
        secondChildren.push(secondRoute);
      }
    });
    if (secondChildren.length > 0) {
      route.children = secondChildren;
      res.push(route);
    }
  });
  return { accessedRouters: res, removeRoutes };
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    whiteListRouters: ['/login'],
    routers: [],
    removeRoutes: [],
  }),
  actions: {
    async initRoutes(roles: Array<IRole>, isAdmin: boolean) {
      const roleIds: number[] = roles.map((obj): number => {
        return obj.id;
      });
      let accessedRouters = [];

      let removeRoutes = [];
      // special token
      if (isAdmin) {
        accessedRouters = asyncRouterList;
      } else {
        if (roleIds.length === 0) {
          const constantStore = getConstantStore();
          DialogPlugin.alert({
            theme: 'danger',
            header: '无权限提示',
            body: '用户无aopx平台权限，请到power平台申请对应角色权限',
            confirmBtn: '点击申请',
            onConfirm: () => {
              window.open(constantStore.getPowerDirectUrl, '_blank');
            },
          });
          NProgress.done();
        }
        const res = filterPermissionsRouters(asyncRouterList, roleIds);
        accessedRouters = res.accessedRouters;
        removeRoutes = res.removeRoutes;
      }
      this.routers = accessedRouters;
      this.removeRoutes = removeRoutes;

      removeRoutes.forEach((item: RouteRecordRaw) => {
        if (router.hasRoute(item.name)) router.removeRoute(item.name);
      });
    },
    async restore() {
      this.removeRoutes.forEach((item: RouteRecordRaw) => {
        router.addRoute(item);
      });
    },
  },
});

export function getPermissionStore() {
  return usePermissionStore(store);
}
