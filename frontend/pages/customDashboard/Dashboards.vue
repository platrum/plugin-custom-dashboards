<template>
  <div class="dashboard">
    <el-menu v-show="!isDemoMode" :class="['dashboards-nav-menu']" :default-active="String(dashboardId)">
      <div class="dashboards-collapse">
        <div class="menu-header">
          <ui-collection-search
            v-model="isVisible"
            :data-loader="getFilteredDashboards"
            :button-text="t('Искать в дашбордах')"
            :results-count="searchResult.length"
            @search="search"
          >
            <ul class="results" v-if="searchResult.length > 0">
              <li class="results-item" v-for="dashboard in searchResult" :key="dashboard.id" @click="clickMenu(dashboard.id)">
                <div class="avatar-container">
                  <user-avatar
                    class="avatar"
                    v-tooltip.bottom="`${t('Владелец')}: ${getUserName(dashboard.owner_user_id)}`"
                    :user-id="dashboard.owner_user_id"
                    :size="20"
                  />
                </div>
                <div class="name">
                  {{ dashboard.name }}
                </div>
              </li>
            </ul>
          </ui-collection-search>

          <el-popover placement="bottom" width="350" v-model="popoverNewDashboard" :show="setFocus('newDashboardInput')">
            <el-input :placeholder="t('Название нового дашборда')" v-model="editableDashboard.name" style="width: 100%" @keyup.enter.native="addNewDashboard" ref="newDashboardInput">
              <el-button @click="addNewDashboard" icon="el-icon-plus" slot="append" />
            </el-input>

            <el-menu-item class="add-dashboard-item" slot="reference" index="addNew">
              <i class="el-icon-plus"></i>
              <span class="add-dashboard">{{ t('Добавить дашборд') }}</span>
            </el-menu-item>
          </el-popover>
        </div>

        <ui-collection-collapse-menu
          v-if="extendedDashboards.length"
          :items="extendedDashboards"
          :groups="groups"
          :favourites-group-params="favouritesGroup"
          @select="clickMenu"
          @update-state="updateState"
        />
      </div>
    </el-menu>

    <div
      ref="dashboardContainer"
      :class="['dashboard-container', { 'demo-mode': isDemoMode }]"
    >
      <ui-element-tooltip placement="left" :content="t('Значения метрик обновляются')" class="dashboard-container__loader">
        <div v-loading="isLoading"></div>
      </ui-element-tooltip>

      <div v-if="!hasDashboards" v-loading="isLoading">
        ← {{ t('Добавьте первый дашборд') }}
      </div>

      <div v-else class="dashboard-kpis">
        <header>
          <el-dropdown
            class="dashboard-settings-menu"
            placement="bottom"
            trigger="click"
            :hide-on-click="false"
            @command="handleDropdownCommand"
          >
            <el-button icon="el-icon-more" size="mini" />

            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>
                <el-switch v-model="isDemoMode" :active-text="t('Режим демонстрации')"></el-switch>
              </el-dropdown-item>

              <el-dropdown-item divided>
                <div style="display: inline-block; width: 200px;">{{ t('Количество колонок') }}</div>
                <el-button-group>
                  <el-button size="mini" @click="resizeDashboard(selectedDashboard.column_count - 1)" icon="el-icon-minus" />
                  <el-button size="mini" @click="resizeDashboard(12)">{{ selectedDashboard.column_count }}</el-button>
                  <el-button size="mini" @click="resizeDashboard(selectedDashboard.column_count + 1)" icon="el-icon-plus" />
                </el-button-group>
              </el-dropdown-item>

              <el-dropdown-item divided command="openDashboardSettings">
                <button class="settings-dropdown-btn">
                  <i class="el-icon-setting" />
                  <span>{{ t('Настройки') }}</span>
                </button>
              </el-dropdown-item>

              <el-dropdown-item divided command="deleteDashboard">
                <button class="settings-dropdown-btn">
                  <i class="el-icon-delete" />
                  <span>{{ t('Удалить') }}</span>
                </button>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>

          <h1 class="dashboard-name">{{ selectedDashboard.name }}</h1>
        </header>

        <ui-draggable
          v-bind="{ animation: 200, ghostClass: 'drag-ghost' }"
          :list="selectedDashboardData"
          handle=".toolbar"
          tag="div"
          group="dashboard-widgets"
          @change="changeOrders"
        >
          <div
            v-for="widget in selectedDashboardData"
            :key="`widget_${widget.user_id}_${widget.id}`"
            class="kpi"
          >
            <widget
              :class="{'events-none': isLoading}"
              :data="widget.data"
              :total-value="widget.total"
              :name="widget.name"
              :configuration="widget.configuration"
              :width="widget.size_width ? selectedDashboardColumnWidth * widget.size_width + ((widget.size_width - 1) * widgetPadding * 3) : selectedDashboardColumnWidth"
              :width-size="+widget.size_width"
              :height="widget.size_height ? selectedDashboardColumnWidth * widget.size_height + ((widget.size_height - 1) * widgetPadding * 3) : selectedDashboardColumnWidth"
              :is-hide-left-bar="widget.is_hide_left_bar"
              :has-filter="widget.filter_preset_key !== null"
              :loading="widget.loading"
              @change="needValidate => $emit('change-widget', widget, needValidate)"
              @delete="deleteWidget(widget)"
              @go-to-tasks="handleGoToTasks(widget.filter_preset_key)"
            >
              <el-dropdown-item slot="menu">
                <el-switch
                  class="widget-bar-switcher"
                  v-model="widget.is_hide_left_bar"
                  :inactive-text="t('Скрыть шкалу')"
                  @change="saveWidget(widget)"
                />
              </el-dropdown-item>

              <el-dropdown-item slot="menu">
                <ui-form-field :label-width="145" style="width: 400px;" label-align="left" :label="t('Ширина')">
                  <el-radio-group v-model="widget.size_width" @change="saveWidget(widget)" size="mini">
                    <el-radio-button v-for="size in widgetSizes" :key="`widget-width_${size}`" :label="size" />
                  </el-radio-group>
                </ui-form-field>
              </el-dropdown-item>

              <el-dropdown-item slot="menu">
                <ui-form-field :label-width="145" style="width: 400px;" label-align="left" :label="t('Высота')">
                  <el-radio-group v-model="widget.size_height" @change="saveWidget(widget)" size="mini">
                    <el-radio-button v-for="size in widgetSizes" :key="`widget-height_${size}`" :label="size" />
                  </el-radio-group>
                </ui-form-field>
              </el-dropdown-item>
            </widget>
          </div>
        </ui-draggable>

        <el-button @click="$emit('open-sidebar')">+ {{ t('Добавить виджет') }}</el-button>

        <el-dialog :title="t('Настройки дашборда') + ' ' + selectedDashboard.name" :visible.sync="isSettingsDialogVisible" width="550px">
          <div>
            <ui-form-field :label-width="120">
              <span slot="label">{{ t('Название') }}</span>
              <ui-input v-model="selectedDashboardName" />
            </ui-form-field>
            <br>

            <ui-form-field :label-width="120">
              <span slot="label">{{ t('Частота обновления (сек)') }}</span>
              <ui-number
                  v-model.trim="selectedDashboardRefreshInterval"
                  :min="5"
              />
            </ui-form-field>
          </div>

          <span slot="footer" class="dialog-footer">
              <el-button type="primary" @click="saveDashboardSettings" :disabled="buttonsDisabled">{{ t('Сохранить') }}</el-button>
              <el-button @click="isSettingsDialogVisible = false" :disabled="buttonsDisabled">{{ t('Отмена') }}</el-button>
            </span>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import Widget from './Widget.vue';

import {
  getDashboardGroup,
  getDataWithPanelNames,
  getDataWithStatusNames,
  getWidgetConfiguration
} from './helper';
import {
  DASHBOARD_GROUPS,
  DEFAULT_DASHBOARD,
  DEFAULT_DASHBOARD_SIZES,
  LEFT_MENU_WIDTH,
  DASHBOARD_PADDING,
  DEFAULT_DASHBOARD_COLUMN,
  DEFAULT_WIDGET_WIDTH,
  DEFAULT_WIDGET_HEIGHT,
  DEFAULT_FILTER_KEY,
  RESPONSIBLE_USER_IDS_METRIC_KEY,
  OWNER_USER_ID_METRIC_KEY,
  BOARD_PANEL_ID_METRIC_KEY,
  STATUS_METRIC_KEY,
  MILLISECONDS_IN_SECOND,
  ITEMS_AMOUNT_METRIC_KEY,
  UNKNOWN_VALUE_TEXT,
  WIDGET_DATA_MULTIPLIER
} from './const';

export default {
  components: { Widget },
  props: {
    selectedDashboard: {
      type: Object,
      default: {},
    },
    selectedDashboardWidgets: {
      type: Array,
      default: [],
    },
    dashboards: {
      type: Array,
      default: [],
    },
    groupFields: {
      type: Array,
      default: [],
    },
    metrics: {
      type: Array,
      default: [],
    },
    filterPresets: {
      type: Array,
      default: [],
    },
    userId: {
      type: String,
      default: '',
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    this.profilesById = this.$modules.user.profile.listIndexed();
  },
  data() {
    return {
      isVisible: false,
      isSettingsDialogVisible: false,

      dashboardsById: {},
      extendedDashboards: [],
      editableDashboard: this.$utils.object.clone(DEFAULT_DASHBOARD),
      popoverNewDashboard: false,
      popoverAddWidget: false,
      buttonsDisabled: false,

      selectedDashboardData: [],
      isSelectedDashboardPublic: false,
      selectedDashboardName: '',
      selectedDashboardRefreshInterval: '',
      selectedDashboardColumnCount: 12,
      isDemoMode: false,
      widgetPadding: 20,
      selectedDashboardOwner: '',
      groups: this.$utils.object.clone(DASHBOARD_GROUPS),
      favouritesGroup: {
        name: this.t('Избранные дашборды'),
        sort: 0,
      },
      searchResult: [],
      modulesData: {
        tasks: {},
      },
      filterPresets: null,
    };
  },
  computed: {
    hasSelectedDashboard() {
      return this.$utils.object.isObject(this.selectedDashboard);
    },
    hasDashboards() {
      return Array.isArray(this.dashboards) && this.dashboards.length > 0;
    },
    dashboardId() {
      return this.hasSelectedDashboard ? this.selectedDashboard.id : null;
    },
    widgetSizes() {
      return DEFAULT_DASHBOARD_SIZES.filter(size => size <= this.selectedDashboardColumnCount);
    },
    leftPaddingOffset() {
      return this.isDemoMode ? DASHBOARD_PADDING : LEFT_MENU_WIDTH;
    },
    selectedDashboardColumnWidth() {
      if (!this.hasSelectedDashboard || this.selectedDashboard.column_count < 1 || !this.$refs.dashboardContainer.offsetWidth) {
        return DEFAULT_DASHBOARD_COLUMN;
      }
      const dashboardWidth = this.$refs.dashboardContainer.offsetWidth - this.leftPaddingOffset;
      return Math.ceil(dashboardWidth / this.selectedDashboard.column_count) - (this.widgetPadding * 3) - 2;
    },
  },
  watch: {
    selectedDashboard: {
      immediate: true,
      deep: true,
      async handler(val) {
        if (!val) {
          return;
        }
        this.setUpdateInterval();
        this.selectedDashboardColumnCount = val.column_count;
        await this.getDashboardData();
        this.setExtendedDashboards();
      },
    },
    dashboards: {
      immediate: true,
      deep: true,
      handler(val) {
        val.forEach(dashboard => {
          this.dashboardsById[dashboard.id] = dashboard;
        });

        this.setExtendedDashboards();
      },
    },
    userId: {
      handler() {
        this.setExtendedDashboards();
      }
    },
  },
  methods: {
    async resizeDashboard(newColumnCount) {
      if (newColumnCount < 1) {
        return;
      }
      this.selectedDashboard.column_count = newColumnCount;
      this.selectedDashboardColumnCount = newColumnCount;
      this.saveDashboard();
    },

    async openDashboardSettings() {
      this.selectedDashboardName = this.selectedDashboard.name;
      this.selectedDashboardColumnCount = this.selectedDashboard.column_count;
      this.selectedDashboardRefreshInterval = this.selectedDashboard.refresh_interval;
      this.isSettingsDialogVisible = true;
    },
    async saveDashboardSettings() {
      this.buttonsDisabled = true;
      this.selectedDashboard.name = this.selectedDashboardName;
      this.selectedDashboard.column_count = this.selectedDashboardColumnCount;

      if (this.selectedDashboard.refresh_interval !== this.selectedDashboardRefreshInterval) {
        this.selectedDashboard.refresh_interval = this.selectedDashboardRefreshInterval;
        this.setUpdateInterval();
      }

      this.isSettingsDialogVisible = false;
      this.saveDashboard();

      this.buttonsDisabled = false;
    },
    saveDashboard() {
      this.$emit('save-dashboard', this.selectedDashboard);
    },

    async deleteDashboard() {
      this.$uiNotify.confirm(this.t('Вы действительно хотите удалить дашборд?'), this.t('Удаление дашборда'), {
        confirmButtonText: this.t('OK'),
        cancelButtonText: this.t('Отмена'),
      }).then(async() => {
        this.$emit('delete-dashboard', this.dashboardId);
      });
    },
    async deleteWidget(item) {
      this.$uiNotify.confirm(this.t('Вы действительно хотите удалить виджет?'), this.t('Удаление виджета'), {
        confirmButtonText: this.t('OK'),
        cancelButtonText: this.t('Отмена'),
      }).then(async() => {
        this.$emit('delete-widget', item);
      });
    },

    async getDashboardData() {
      this.$emit('data-loading', true);
      const sortedWidgets = Array.isArray(this.selectedDashboardWidgets)
        ? this.$utils.array.cloneAndSortBy(this.selectedDashboardWidgets, 'order')
        : [];
      let result = [];

      for (let i in sortedWidgets) {
        const widget = sortedWidgets[i];
        if (!widget.size_width) {
          widget.size_width = DEFAULT_WIDGET_WIDTH;
        }
        if (!widget.size_height) {
          widget.size_height = DEFAULT_WIDGET_HEIGHT;
        }
        if (widget.module) {
          const moduleData = await this.getModuleData(widget);
          widget.data = moduleData.data;
          widget.total = moduleData.total;
          widget.configuration = getWidgetConfiguration(widget, this.groupFields, this.metrics, this.filterPresets);
        }

        widget.loading = false;
        result.push(widget);
      }

      this.$emit('data-loading', false);
      this.selectedDashboardData = result;
    },
    setExtendedDashboards() {
      const dashboards = this.dashboards.map(item => {
        return {
          ...item,
          group: getDashboardGroup(item, this.userId),
          selected: item.id === this.selectedDashboard.id,
          inactive: this.$modules.user.profile.getById(item.owner_user_id).is_disabled,
        };
      });

      this.extendedDashboards = this.$utils.array.cloneAndSortBy(dashboards, 'owner_user_id');
    },
    async getModuleData(widget) {
      const filterPresetKey = typeof widget.filter_preset_key === 'string' && widget.filter_preset_key !== '' ? widget.filter_preset_key : DEFAULT_FILTER_KEY;
      if (!Array.isArray(this.modulesData[widget.module][filterPresetKey])) {
        const filter = this.getFilterByFilterPresetKey(widget.filter_preset_key)
        if (filter === null) {
          widget.filter_preset_key = null;
          return { data: null, total: 0 };
        }

        this.modulesData[widget.module][filterPresetKey] = await this.$modules.tasks.task.loadTasks(filter.oldFormatFilter, filter.dbFormatFilter);
      }
      let data = {};
      let total = 0;

      if (widget.metric === ITEMS_AMOUNT_METRIC_KEY) {
        total = this.modulesData[widget.module][filterPresetKey].length;
        this.modulesData[widget.module][filterPresetKey].forEach(task => {
          if (Array.isArray(task[widget.group])) {
            task[widget.group].forEach(groupItem => {
              if (data[groupItem]) {
                data[groupItem] = data[groupItem] + 1;
              } else {
                data[groupItem] = 1;
              }
            });
            return;
          }

          if (task[widget.group] && data[task[widget.group]]) {
            data[task[widget.group]] = data[task[widget.group]] + 1;
          } else if (task[widget.group]) {
            data[task[widget.group]] = 1;
          }
        });
      } else {
        this.modulesData[widget.module][filterPresetKey].forEach(task => {
          if (!task[widget.group] || !task[widget.metric]) {
            return;
          }

          total = total + task[widget.metric];

          if (data[task[widget.group]]) {
            data[task[widget.group]] = data[task[widget.group]] + Number(task[widget.metric]);
          } else {
            data[task[widget.group]] = Number(task[widget.metric]);
          }
        });
      }

      Object.keys(data).forEach(key => {
        data[key] = Math.round(data[key] * WIDGET_DATA_MULTIPLIER) / WIDGET_DATA_MULTIPLIER;
      });

      if ([RESPONSIBLE_USER_IDS_METRIC_KEY, OWNER_USER_ID_METRIC_KEY].includes(widget.group)) {
        data = this.getDataWithUserNames(data);
      }

      if (widget.group === BOARD_PANEL_ID_METRIC_KEY) {
        data = await getDataWithPanelNames(data, this.$platform);
      }

      if (widget.group === STATUS_METRIC_KEY) {
        data = await getDataWithStatusNames(data, this.$platform);
      }

      return { data, total };
    },
    getDataWithUserNames(data) {
      const newData = {};
      Object.keys(data).forEach(userId => {
        const user = this.profilesById[userId];
        const userName = typeof user === 'object' ? user.name : UNKNOWN_VALUE_TEXT;
        newData[userName] = data[userId];
      });

      return newData;
    },

    async addNewDashboard() {
      if (this.editableDashboard.name.length > 0) {
        this.popoverNewDashboard = false;
        this.$emit('add-dashboard', this.editableDashboard);

        this.editableDashboard = this.$utils.object.clone(DEFAULT_DASHBOARD);
      }
    },

    getFilteredDashboards(query) {
      this.searchQuery = query;

      const lowerQuery = query.toLowerCase();
      const result = this.extendedDashboards.filter(dashboard => {
        const userName = this.getUserName(dashboard.owner_user_id).toLowerCase();
        const lowerTitle = dashboard.name.toLowerCase();
        return userName.includes(lowerQuery) || lowerTitle.includes(lowerQuery);
      });
      return {result};
    },
    search(result) {
      this.searchResult = result;
    },
    async updateState(updatedDashboard) {
      this.$emit('save-dashboard', updatedDashboard)
      this.updateFavouriteDashboardsIds();
    },
    updateFavouriteDashboardsIds() {
      const dashboards = Object.keys(this.dashboardsById).map(key => this.dashboardsById[key]);
      this.favouritesDashboardsIds = dashboards
          .filter(dashboard => dashboard.is_favourite)
          .map(dashboard => dashboard.id);
    },

    setUpdateInterval() {
      this.unsetUpdateInterval();

      if (this.selectedDashboard.refresh_interval > 0) {
        this.pageUpdateInterval = setInterval(() => {
          this.getDashboardData();
        }, this.selectedDashboard.refresh_interval * MILLISECONDS_IN_SECOND);
      }
    },
    unsetUpdateInterval() {
      if (!this.pageUpdateInterval) {
        return;
      }
      clearInterval(this.pageUpdateInterval);
    },

    clickMenu(dashboardId) {
      this.$emit('change-dashboard', dashboardId);
      this.isVisible = false;
    },
    getUserName(userId) {
      return this.$modules.user.profile.getName(userId);
    },
    setFocus(name) {
      if (!this.$utils.object.isObject(this.$refs[name])) {
        return;
      }

      this.$nextTick(() => {
        this.$refs[name].focus();
      });
    },
    handleDropdownCommand(command) {
      if (typeof this[command] === 'function') {
        this[command]();
      }
    },
    async changeOrders(event) {
      const newIndex = event.moved.newIndex;
      let order = 1;
      if (newIndex > 0) {
        const previousWidget = this.selectedDashboardData[newIndex - 1];
        order = previousWidget.order + 1;
      }
      let widget = event.moved.element;
      widget.order = order;

      this.$emit('save-widgets-order', this.$utils.array.cloneAndSortBy(this.selectedDashboardData, 'order').map(widget => widget.id));
      await this.getDashboardData();
    },
    async saveWidget(widget) {
      this.showLoader(widget);

      this.$emit('save-widget', widget);
      await this.getDashboardData();
    },
    showLoader(widget) {
      widget.loading = true;
      setTimeout(() => widget.loading = false, 1000);
    },
    getFilterByFilterPresetKey(filterPresetKey) {
      const filterPreset = this.filterPresets.find(filter => filter.key === filterPresetKey);
      const hasFilterPreset = typeof filterPreset === 'object' && filterPreset !== null && typeof filterPreset.filter === 'object';
      if (!hasFilterPreset) {
        return null;
      }
      const filter = this.$utils.object.clone(filterPreset.filter);

      if (typeof filterPreset.filter.advanced_filter === 'string') {
        filter.oldFormatFilter.advanced_filter = JSON.parse(filterPreset.filter.advanced_filter);
        filter.dbFormatFilter = JSON.parse(filterPreset.filter.advanced_filter);
      }
      Object.keys(filter.oldFormatFilter).forEach(key => {
        if (typeof filter.oldFormatFilter[key] === 'object') {
          filter.oldFormatFilter[key] = JSON.stringify(filter.oldFormatFilter[key]);
        }
      });

      return filter;
    },
    handleGoToTasks(filterPresetKey) {
      const filter = this.getFilterByFilterPresetKey(filterPresetKey);
      this.$platform.router.openWindow('tasks.list', { filter: JSON.stringify(filter), ...filter.oldFormatFilter });
    },
  },
};
</script>

<style lang="less" scoped>
.loader {
  width: 100%;
  height: 100vh;
}

header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

h1 {
  font-size: 16px;
  font-weight: normal;
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
  margin-bottom: 4px;
}

.kpi {
  display: inline-block;
  vertical-align: middle;
  border-radius: 2px;
  padding: 20px;
  margin: 0 8px 20px 0;
  background: rgba(82, 100, 107, 0.03);
}

.hover-button {
  visibility: hidden;
}

.kpi:hover {
  .hover-button {
    visibility: visible;
  }
}

.public {
  color: gray;
}

.widget-bar-switcher {
  justify-content: space-between;
  color: #333;

  & /deep/ .el-switch__label,
  & /deep/ .el-switch__label.is_active {
    width: 145px;
    color: inherit;
  }
}

.dashboard {
  &-name,
  &-owner {
    display: inline-block;
    margin-left: 6px;
  }

  &-owner {
    color: #BBBBBB;
    font-size: 14px;
  }
}

.settings-dropdown-btn {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  outline: none;
  cursor: pointer;
}

.feature-disabled {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 20px;
  text-align: center;

  p {
    margin-bottom: 5px;
    font-size: 14px;
    line-height: 18px;
    color: #909399;
  }
}

.drag-ghost {
  opacity: 0.5;
  filter: blur(2px);
}

.dashboards-nav-menu {
  position: fixed;
  left: 50px;
  top:0;
  bottom: 0;
  z-index: 100;
  width: 279px;
  padding-left: 10px;
  overflow-x: hidden;
  overflow-y: auto;
}

.dashboards-collapse {
  position: relative;
  padding-left: 21px;
  padding-right: 10px;
  font-family: 'PT Root UI', sans-serif;

  .menu-header {
    position: sticky;
    top: 0;
    padding-top: 15px;
    background: #FFFFFF;
    z-index: 1;
  }

  .search {
    margin: 14px 0;
  }

  .add-dashboard-item {
    height: 41px;
    line-height: unset;
    padding-left: 0 !important;
    padding-top: 10px;
    padding-bottom: 10px;
    margin-top: 13px;
    color: #66698C;

    &:hover {
      background: #FFFFFF;
      color: #006ebf;

      .el-icon-plus {
        color: #006ebf;
      }
    }

    .el-icon-plus {
      margin-right: 0;
      width: 20px;
      font-size: 15px;
    }
  }
}

.results {
  padding: 16px;

  .results-item {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    padding: 8px 12px;
    background: #F4F4F4;
    border-radius: 4px;
    cursor: pointer;
  }

  .name {
    margin-left: 6px;
    font-family: 'PT Root UI', sans-serif;
    font-style: normal;
    font-weight: normal;
    font-size: 13px;
    line-height: 20px;
  }
}

.dashboard-container {
  position: relative;
  min-height: 500px;
  padding: 20px 20px 0 279px;

  &.demo-mode {
    padding-left: 20px;
  }

  &__loader {
    position: fixed;
    top: 40px;
    right: 100px;
  }
}

.dashboard-kpis {
  padding-bottom: 100px;
}

.events-none {
  pointer-events: none;
}

@media print {
  .dashboards-nav-menu {
    display: none;
  }

  .dashboard-settings-menu {
    display: none;
  }

  .dashboard-container {
    padding: 20px 20px 0 20px;
  }

  .add-widget-popover {
    display: none;
  }

  .dashboard-container__loader {
    display: none;
  }
}
</style>
