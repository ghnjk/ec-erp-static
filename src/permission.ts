import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import { getPermissionStore, getUserStore } from '@/store';
import router from '@/router';
import { getConstantStore } from '@/store/modules/constant';
import { getGroupInfoStore } from '@/store/modules/groupinfo';

declare global {
  interface Window {
    FTP_EVENT: any;
  }
}

const permissionStore = getPermissionStore();
const userStore = getUserStore();
const constantStore = getConstantStore();
const sleep = (time) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

NProgress.configure({ showSpinner: false });

const { whiteListRouters } = permissionStore;

router.beforeEach(async (to, from, next) => {
  // eslint-disable-next-line no-restricted-globals
  if (self !== top && self.name === 'ftp-aopx') {
    // 判断是在FTP基座下运行才进行触发回调
    if (window.FTP_EVENT && typeof window.FTP_EVENT.routeChangeCb === 'function') {
      window.FTP_EVENT.routeChangeCb(to);
    }
  }
  NProgress.start();
  const { userInfo } = userStore;
  if (userInfo) {
    const { roles, isAdmin } = userStore;

    if ((roles && roles.length > 0) || isAdmin) {
      // 当已经在页面中, 跳转到其他页面, 会走这个逻辑
      next();
    } else {
      // 浏览器第一次输入url, 会进入这个逻辑
      const authMsg = MessagePlugin.loading({ content: '校验用户权限中...', duration: 0 });
      try {
        await sleep(800);

        await userStore.login();

        const { roles, isAdmin } = userStore;

        await permissionStore.initRoutes(roles, isAdmin);
        // 基础平台SRE组员工
        await getGroupInfoStore().getStaffInfo();
        if (router.hasRoute(to.name)) {
          next();
        } else {
          next('/');
        }
        MessagePlugin.close(authMsg);
      } catch (error) {
        if (error?.response?.status === 401) {
          MessagePlugin.close(authMsg);
          const { redirecturl } = error.response.headers;
          if (redirecturl) {
            MessagePlugin.loading(`即将跳转到power登录...`);
            setTimeout(() => {
              MessagePlugin.closeAll();
              window.location.href = redirecturl;
            }, 800);
          }
        } else if (error?.response?.status === 403) {
          MessagePlugin.close(authMsg);
          DialogPlugin.alert({
            theme: 'danger',
            header: '无权限提示',
            body: '用户无aopx平台权限，请到power平台申请对应角色权限',
            confirmBtn: '点击申请',
            onConfirm: () => {
              window.open(constantStore.getPowerDirectUrl, '_blank');
            },
          });
        } else {
          MessagePlugin.error(`系统异常, 请稍后重试: ${error}`);
          // MessagePlugin.closeAll();
        }
        NProgress.done();
      }
    }
  } else {
    /* white list router */
    if (whiteListRouters.includes(to.path)) {
      next();
    } else {
      MessagePlugin.error('无用户信息, 请到power平台申请平台权限');
    }

    NProgress.done();
  }
});

router.afterEach(() => {
  NProgress.done();
});
