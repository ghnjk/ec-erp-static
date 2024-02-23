import { defineStore } from 'pinia';
import { TOKEN_NAME } from '@/config/global';
import { store } from '@/store';
import { getLoginUserInfo } from '@/apis/sysApis';

export interface IRole {
  id: number;
  systemId: number;
  name: string;
  memo: string;
  level: number;
  auditTmplId: number;
  tag: string;
}

export interface IUserInfo {
  userName: string;
  groupName: string;
  roles: IRole[];
  admin: boolean;
}

const InitUserInfo: IUserInfo = {
  userName: '',
  groupName: '',
  roles: [],
  admin: false,
};

export const useUserStore = defineStore('user', {
  state: () => ({
    // token: localStorage.getItem(TOKEN_NAME) || 'main_token', // 默认token不走权限
    userInfo: InitUserInfo,
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
    isAdmin: (state) => {
      return state.userInfo?.admin;
    },
    userName: (state) => {
      return state.userInfo?.userName;
    },
  },
  actions: {
    async login() {
      try {
        this.userInfo = await getLoginUserInfo();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    async logout() {
      localStorage.removeItem(TOKEN_NAME);
      this.token = '';
      this.userInfo = InitUserInfo;
    },
    async removeToken() {
      this.token = '';
    },
  },
});

export function getUserStore() {
  return useUserStore(store);
}
