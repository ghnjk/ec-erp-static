import request from '@/utils/request';

/**
 * 获取用户登录信息
 */
export const getLoginUserInfo = () => {
  return request.post('/erp_api/system/get_login_user_info');
};

/**
 * 用户登录
 */
export const login = (loginInfo) => {
  return request.post('/erp_api/system/login_user', loginInfo);
};

/**
 * 字典
 */
export const dictApi = (req: any) => {
  return request.post('/erp_api/system/dict', req);
};
