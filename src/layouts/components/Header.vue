<template>
  <div :class="layoutCls">
    <t-head-menu :class="menuCls" :theme="theme" :value="active" expand-type="popup">
      <template #logo>
        <span v-if="showLogo" :class="`${prefix}-side-nav-logo-wrapper`" @click="handleNav('/')">
          <component :is="getLogo()" :class="`${prefix}-side-nav-logo-${collapsed ? 't' : 'tdesign'}-logo`" />
        </span>
        <div v-else class="header-operate-left">
          <t-button shape="square" theme="default" variant="text" @click="changeCollapsed">
            <t-icon class="collapsed-icon" name="view-list" />
          </t-button>
        </div>
      </template>
      <div id="projectSelector">
        <span class="label">国家：</span>
        <t-select
          v-model="selectedProject"
          :options="projectOptions"
          placeholder="请选择项目"
          size="medium"
          style="width: 120px"
          @change="handleProjectChange"
        />
      </div>
      <template #operations>
        <div class="operations-container">
          <p v-if="currentEnv !== 'release'" class="env-font">{{ currentEnv }}</p>
          <t-divider layout="vertical" />
          <t-tooltip content="代码仓库" placement="bottom">
            <t-button shape="square" theme="default" variant="text" @click="navToGitHub">
              <t-icon name="logo-github" />
            </t-button>
          </t-tooltip>
          <t-tooltip content="帮助文档" placement="bottom">
            <t-button shape="square" theme="default" variant="text" @click="navToHelper">
              <t-icon name="help-circle" />
            </t-button>
          </t-tooltip>
          <menu-content :nav-data="menu.filter((item) => item.group === undefined)" class="header-menu" />
          <t-tooltip content="个人信息" placement="bottom">
            <t-button class="header-user-btn" theme="default" variant="text">
              <template #icon>
                <t-icon class="header-user-avatar" name="user-circle" />

                <!--
                <t-avatar :image="usrImage" :hide-on-load-failed="false" size="small" />
                -->
              </template>

              <div class="header-user-account">{{ userName }}</div>
            </t-button>
          </t-tooltip>
          <t-tooltip content="系统设置" placement="bottom">
            <t-button shape="square" theme="default" variant="text">
              <t-icon name="setting" @click="toggleSettingPanel" />
            </t-button>
          </t-tooltip>
        </div>
      </template>
    </t-head-menu>
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingStore, useUserStore } from '@/store';
import { getActive } from '@/router';
import { prefix } from '@/config/global';
import { MenuRoute } from '@/types/interface';
import { getLoginUserInfo } from '@/apis/sysApis';

import MenuContent from './MenuContent.vue';
import tLogo from '@/assets/assets-t-logo.svg?component';
import tLogoFull from '@/assets/assets-logo-full.svg?component';

const props = defineProps({
  theme: {
    type: String,
    default: '',
  },
  layout: {
    type: String,
    default: 'top',
  },
  showLogo: {
    type: Boolean,
    default: true,
  },
  menu: {
    type: Array as PropType<MenuRoute[]>,
    default: () => [],
  },
  isFixed: {
    type: Boolean,
    default: false,
  },
  isCompact: {
    type: Boolean,
    default: false,
  },
  maxLevel: {
    type: Number,
    default: 3,
  },
});

const selectedProject = ref('');
const projectOptions = [
  { label: '菲律宾', value: 'philipine' },
  { label: '马来西亚', value: 'malaysia' },
  { label: '印度尼西亚', value: 'indonesia' },
  { label: '泰国', value: 'thailand' },
];

// 获取用户信息并设置默认项目
const initializeProject = async () => {
  try {
    const res: any = await getLoginUserInfo();
    selectedProject.value = res.project_id;
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

onMounted(() => {
  initializeProject();
});

const handleProjectChange = (value: string) => {
  const urlMap = {
    philipine: 'http://150.109.158.22/index.html',
    malaysia: 'http://8.210.60.7:2080/index.html',
    indonesia: 'http://8.210.60.7:2081/index.html',
    thailand: 'http://8.210.60.7:2082/index.html',
  };
  const targetUrl = urlMap[value];
  if (targetUrl) {
    window.open(targetUrl, '_self');
  }
};

const { userName } = useUserStore();
const currentEnv = import.meta.env.MODE;
const usrImage = computed(() => `https://rhrc.woa.com/photo/150/${userName}.png`);
const router = useRouter();
const settingStore = useSettingStore();
const collapsed = computed(() => useSettingStore().isSidebarCompact);

const toggleSettingPanel = () => {
  settingStore.updateConfig({
    showSettingPanel: true,
  });
};

const active = computed(() => getActive());

const layoutCls = computed(() => [`${prefix}-header-layout`]);

const menuCls = computed(() => {
  const { isFixed, layout, isCompact } = props;
  return [
    {
      [`${prefix}-header-menu`]: !isFixed,
      [`${prefix}-header-menu-fixed`]: isFixed,
      [`${prefix}-header-menu-fixed-side`]: layout === 'side' && isFixed,
      [`${prefix}-header-menu-fixed-side-compact`]: layout === 'side' && isFixed && isCompact,
    },
  ];
});
const getLogo = () => {
  if (collapsed.value) return tLogo;
  return tLogoFull;
};

const changeCollapsed = () => {
  settingStore.updateConfig({
    isSidebarCompact: !settingStore.isSidebarCompact,
  });
};

const handleNav = (url) => {
  router.push(url);
};

// const handleLogout = () => {
//   router.push(`/login?redirect=${router.currentRoute.value.fullPath}`);
// };

const navToGitHub = () => {
  window.open('https://git.woa.com/fit_component_op/aop-v2');
};

const navToHelper = () => {
  window.open('https://iwiki.woa.com/p/163045097');
};
</script>
<style lang="less" scoped>
.@{starter-prefix}-header {
  &-layout {
    height: 64px;
  }

  &-menu-fixed {
    position: fixed;
    top: 0;
    z-index: 1001;

    &-side {
      left: 232px;
      right: 0;
      z-index: 10;
      width: auto;
      transition: all 0.3s;

      &-compact {
        left: 64px;
      }
    }
  }

  &-logo-container {
    cursor: pointer;
    display: inline-flex;
    height: 64px;
  }
}

.header-menu {
  flex: 1 1 1;
  display: inline-flex;

  :deep(.t-menu__item) {
    min-width: unset;
    padding: 0px 16px;
  }
}

.operations-container {
  display: flex;
  align-items: center;
  margin-right: 12px;

  .t-popup__reference {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .t-button {
    margin: 0 8px;

    &.header-user-btn {
      margin: 0;
    }
  }

  .t-icon {
    font-size: 20px;

    &.general {
      margin-right: 16px;
    }
  }
}

.header-operate-left {
  display: flex;
  margin-left: 20px;
  align-items: normal;
  line-height: 0;

  .collapsed-icon {
    font-size: 20px;
  }
}

.header-logo-container {
  width: 184px;
  height: 26px;
  display: flex;
  margin-left: 24px;
  color: var(--td-text-color-primary);

  .t-logo {
    width: 100%;
    height: 100%;

    &:hover {
      cursor: pointer;
    }
  }

  &:hover {
    cursor: pointer;
  }
}

.header-user-account {
  display: inline-flex;
  align-items: center;
  color: var(--td-text-color-primary);

  .t-icon {
    margin-left: 4px;
    font-size: 16px;
  }
}

:deep(.t-head-menu__inner) {
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.t-menu--light {
  .header-user-account {
    color: var(--td-text-color-primary);
  }
}

.t-menu--dark {
  .t-head-menu__inner {
    border-bottom: 1px solid var(--td-gray-color-10);
  }

  .header-user-account {
    color: rgba(255, 255, 255, 0.55);
  }

  .t-button {
    --ripple-color: var(--td-gray-color-10) !important;

    &:hover {
      background: var(--td-gray-color-12) !important;
    }
  }
}

.operations-dropdown-container-item {
  width: 100%;
  display: flex;
  align-items: center;

  .t-icon {
    margin-right: 8px;
  }

  :deep(.t-dropdown__item) {
    .t-dropdown__item__content {
      display: flex;
      justify-content: center;
    }

    .t-dropdown__item__content__text {
      display: flex;
      align-items: center;
      font-size: 14px;
    }
  }

  :deep(.t-dropdown__item) {
    width: 100%;
    margin-bottom: 0px;
  }

  &:last-child {
    :deep(.t-dropdown__item) {
      margin-bottom: 8px;
    }
  }
}

.operations-container {
  .env-font {
    color: #d6d6d6;
    font-family: TencentSansW7;
  }
}

#projectSelector {
  margin: 0 8px;
  display: flex;
  align-items: center;

  .label {
    margin-right: 4px;
    color: var(--td-text-color-primary);
    font-size: 14px;
  }
}
</style>
