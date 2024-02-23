const currentEnv = import.meta.env.MODE;

export const prefix = 'tdesign-starter';
export const TOKEN_NAME = 'tdesign-starter';
// 管理员power角色id
export const USER_ROLE_ADMIN = currentEnv !== 'release' ? 9010 : 7986;
// 运维人员power角色id
export const USER_ROLE_OPS = currentEnv !== 'release' ? 9011 : 7984;
// 开发人员power角色id
export const USER_ROLE_DEV = currentEnv !== 'release' ? 9012 : 7985;
