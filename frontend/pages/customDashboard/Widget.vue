<template>
  <div class="container common" :style="wrapperStyle">
    <div v-if="!hasData && !hasFilter" class="no-filter-container">
      <p class="no-filter-message">{{ t('Выбранный фильтр не найден, возможно, он был удален. Пожалуйста, измените фильтр в настройках виджета') }}</p>
      <el-button
        size="small"
        @click="changeEmit(true)"
      >
        {{ t('Открыть настройки виджета') }}
      </el-button>
    </div>

    <div v-else>
      <ui-toolbar
        background-color="transparent"
        :border="false"
        :height="TOOLBAR_WIDGET_HEIGHT"
        :style-slot-left="{ width: 'calc(100% - 44px)', cursor: 'move' }"
      >
        <div class="left-toolbar-wrapper">
          <div class="title-wrapper">
            <h3 class="title">
              <ui-element-tooltip v-if="name" :content="name">
                <p ref="firstKpiTitle" :class="{'less-three-cell': widthSize <= 3}" class="text_overflow">
                  {{ name }}
                </p>
              </ui-element-tooltip>
            </h3>
            <ui-icon
              class="hint-icon"
              name="question-circle"
              :font-size="14"
              v-tooltip.top="{ content: configuration, delay: 0 }"
            />
          </div>

          <div class="additional-info-wrapper">
            <div v-if="hasData && hasTotalValue" class="total">
              <div class="total-label">{{ t('Всего') }}:</div>
              <div class="total-value">{{ totalValue }}</div>
            </div>

            <ui-button
              fa-icon="arrow-up-right-from-square"
              fa-type="light"
              size="small"
              v-tooltip.top="{ content: t('Открыть источник данных в новом окне'), delay: 0 }"
              @click="handleGoToTasks"
            />
          </div>
        </div>

        <div slot="right" class="hover-menu" v-show="$slots.menu">
          <el-dropdown
            placement="bottom"
            trigger="click"
            @command="handleDropdownCommand"
          >
            <el-button icon="el-icon-more" size="mini" />
            <el-dropdown-menu slot="dropdown">
              <slot name="menu"></slot>
              <el-dropdown-item :divided="!!$slots.menu" command="changeEmit">
                <div>
                  <i class="el-icon-edit" />&nbsp;<span>{{ t('Изменить') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item :divided="!!$slots.menu" command="deleteEmit">
                <div>
                  <i class="el-icon-delete" />&nbsp;<span>{{ t('Удалить') }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </ui-toolbar>

      <bar-chart
        :data="data"
        :width="width"
        :height="height"
        :is-hide-left-bar="isHideLeftBar"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script>
import BarChart from './charts/barChart.vue';

import { TOOLBAR_WIDGET_HEIGHT } from './const';

export default {
  components: {
    BarChart,
  },
  props: {
    name: {
      type: String,
      default: '',
    },
    configuration: {
      type: String,
      default: '',
    },
    data: Object,
    totalValue: Number,
    width: Number,
    height: Number,
    widthSize: Number,
    isHideLeftBar: Boolean,
    hasFilter: Boolean,
    loading: Boolean,
  },
  data() {
    return {
      TOOLBAR_WIDGET_HEIGHT,
    };
  },
  computed: {
    hasData() {
      return typeof this.data === 'object' && this.data !== null && Object.keys(this.data).length > 0;
    },
    hasTotalValue() {
      return typeof this.totalValue === 'number';
    },
    wrapperStyle() {
      return {
        width: this.width + 'px',
        height: this.height + 'px',
      };
    },
  },
  methods: {
    changeEmit(needValidate = false) {
      this.$emit('change', needValidate);
    },
    async deleteEmit() {
      await this.$emit('delete');
    },
    handleDropdownCommand(command) {
      if (typeof this[command] === 'function') {
        this[command]();
      }
    },
    handleGoToTasks() {
      this.$emit('go-to-tasks');
    },
  },
};
</script>

<style lang="less" scoped>
.text_overflow {
  -ms-text-overflow: ellipsis;
  -o-text-overflow: ellipsis;
  text-overflow: ellipsis;
  overflow: hidden;
  -ms-line-clamp: 2;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  display: -webkit-box;
  display: box;
  word-wrap: break-word;
  -webkit-box-orient: vertical;
  box-orient: vertical;
}

h1 {
  font-size: 16px;
  font-weight: normal;
  margin-bottom: 14px;
  line-height: 22px;
}

h2 {
  font-size: 14px;
  font-weight: normal;
  margin: 20px 0 14px 0;
  line-height: 18px;
}

h3 {
  font-size: 13px;
  font-weight: bold;
}

.hover-menu {
  visibility: hidden;
}

.container:hover {
  .hover-menu {
    visibility: visible;
  }
}

.less-three-cell {
  font-size: 10px;
}

.title {
  font-size: 16px;
}

.graph-color {
  flex-shrink: 0;
  margin-right: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;

  &.first {
    background-color: #3051BF;
  }

  &.second {
    background-color: #F5993D;
  }
}

.attached-link {
  display: block;
  height: 13px;
  margin-left: 10px;
  text-decoration: none;
  color: #2b2b2b;

  &:hover {
    opacity: 0.6;
  }

  &:active {
    opacity: 0.4;
  }
}

.hint {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  font-size: 10px;
  color: #a2a4a8;
}

.sum {
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  color: #989AB3;

  .sum-value {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: 4px;
  }

  .graph-color {
    display: inline-flex;

    &.first {
      margin-right: 4px;
    }

    &.second {
      margin-left: 4px;
      margin-right: 4px;
    }
  }
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 40px;
  line-height: 1;
  margin-right: 10px;

  .hint-icon {
    cursor: pointer !important;
  }
}

.user-name {
  word-break: break-word;
}

.additional-info-wrapper {
  display: flex;
  align-items: center;
}

.total {
  margin-right: 8px;

  .total-label {
    display: inline;
    color: #A4AAAC;
    font-size: 12px;
    line-height: 16px;
  }

  .total-value {
    display: inline;
    color: #1B2A30;
    font-size: 18px;
    line-height: 24px;
  }
}

.no-filter-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.no-filter-message {
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  line-height: 1.35;
  color: #3C3E53;
}
</style>
