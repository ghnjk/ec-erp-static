import request from '@/utils/request';

/**
 * 获取用户登录信息
 */
export const getLoginUserInfo = () => {
  return request.post('/aop_web/system/get_login_user_info');
};

/**
 * 字典
 */
export const dictApi = (req: any) => {
  return request.post('/aop_web/system/dict', req);
};
