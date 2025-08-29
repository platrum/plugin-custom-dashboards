<template>
  <div>
    <dashboards
      v-loading="isLoading || isInitialLoading"
      :selected-dashboard="selectedDashboard"
      :selected-dashboard-widgets="selectedDashboardWidgets"
      :dashboards="dashboardList"
      :group-fields="groupFields"
      :metrics="countableMetrics"
      :filter-presets="filterPresets"
      :user-id="userId"
      :is-loading="isLoading || isInitialLoading"

      @data-loading="handleDataLoading"

      @add-dashboard="handleSaveDashboard"
      @save-dashboard="handleSaveDashboard"
      @change-dashboard="handleChangeSelectedDashboard"
      @delete-dashboard="handleDeleteDashboard"

      @open-sidebar="handleSidebarOpen"
      @save-widget="handleSaveWidget"
      @change-widget="handleSidebarOpen"
      @delete-widget="handleDeleteWidget"
      @save-widgets-order="handleSaveWidgetsOrder"
    />

    <sidebar
      ref="sidebar"
      v-model="selectedWidget"
      :group-fields="groupFields"
      :metrics="countableMetrics"
      :filters="filterPresets"

      @input="handleUpdateWidget"
      @hide="handleSidebarHide"
    />
  </div>
</template>

<script>
import Dashboards from './Dashboards.vue';
import Sidebar from './Sidebar.vue';

import { getMaxIdNumber, updateList } from './helper';
import {
  DEFAULT_DASHBOARD,
  DEFAULT_WIDGET,
  STORAGE_DASHBOARDS_KEY,
  STORAGE_LAST_ACTIVE_DASHBOARD_ID_KEY,
  STORAGE_WIDGETS_KEY,
  WIDGET_GROUP_FIELDS,
  WIDGET_METRICS
} from './const';

export default {
  components: {
    Dashboards,
    Sidebar,
  },
  created() {
    this.loadInitialData();
  },
  data() {
    return {
      dashboardList: [],
      widgetList: [],
      filterPresets: [],
      customFields: [],
      userId: '',
      selectedDashboard: this.$utils.object.clone(DEFAULT_DASHBOARD),
      selectedDashboardWidgets: [],
      selectedWidget: this.$utils.object.clone(DEFAULT_WIDGET),

      isLoading: false,
      isInitialLoading: false,
    };
  },
  computed: {
    groupFields() {
      return [
        ...WIDGET_GROUP_FIELDS,
        ...this.customFields
          .filter(field => field.data_type === 'string')
          .map(field => {
            return {
              key: field.key,
              name: field.name,
            };
          }),
      ];
    },
    countableMetrics() {
      return [
        ...WIDGET_METRICS,
        ...this.customFields
          .filter(field => ['int', 'float'].includes(field.data_type))
          .map(field => {
            return {
              key: field.key,
              name: field.name,
            };
          }),
      ];
    },
  },
  methods: {
    getCurrentUserId() {
      const profile = this.$modules.user.profile.getCurrent();
      return this.$utils.object.isObject(profile) ? profile.user_id : '';
    },
    setSelectedDashboard(item) {
      let dashboard = this.$utils.object.clone(item);
      const widgets = [];

      if (Array.isArray(dashboard.widget_ids)) {
        dashboard.widget_ids.forEach(widgetId => {
          const widget = this.widgetList.find(widgetItem => widgetItem.id === widgetId);
          if (typeof widget === 'object') {
            widgets.push(widget);
          }
        });
      }

      this.selectedDashboard = dashboard;
      this.$modules.auth.settings.saveSetting(STORAGE_LAST_ACTIVE_DASHBOARD_ID_KEY, this.selectedDashboard.id);
      this.selectedDashboardWidgets = widgets;
    },
    loadData() {
      this.isLoading = true;

      const dashboardList = this.$modules.auth.settings.getSetting(STORAGE_DASHBOARDS_KEY);
      if (Array.isArray(dashboardList)) {
        this.dashboardList = dashboardList;
      }

      const widgetList = this.$modules.auth.settings.getSetting(STORAGE_WIDGETS_KEY);
      if (Array.isArray(widgetList)) {
        this.widgetList = widgetList;
      }

      this.isLoading = false;
    },
    async loadInitialData() {
      this.isInitialLoading = true;

      this.loadData();

      if (this.dashboardList.length > 0) {
        const lastActiveDashboardId = this.$modules.auth.settings.getSetting(STORAGE_LAST_ACTIVE_DASHBOARD_ID_KEY);
        const lastActiveDashboard = this.dashboardList.find(dashboard => dashboard.id === lastActiveDashboardId);
        if (typeof lastActiveDashboard === 'object') {
          this.setSelectedDashboard(lastActiveDashboard);
        } else {
          this.setSelectedDashboard(this.dashboardList[0]);
        }
      }

      this.userId = this.getCurrentUserId();
      this.filterPresets = this.$modules.auth.settings.getSetting('panel-filter.tasks.list.presets') || [];
      this.customFields = await this.$platform.api.requestRoute('tasks.api.task.field.list');

      this.isInitialLoading = false;
    },

    setDashboardSettings(item) {
      const formattedItem = this.$utils.object.clone(item);

      if (typeof formattedItem.id !== 'number') {
        const lastId = getMaxIdNumber(this.dashboardList);
        formattedItem.id = typeof lastId === 'number' ? lastId + 1 : 0;
      }

      if (!formattedItem.owner_user_id) {
        formattedItem.owner_user_id = this.userId;
      }

      if (typeof item.id === 'number' && Array.isArray(this.selectedDashboardWidgets) && this.selectedDashboardWidgets.length > 0) {
        formattedItem.widget_ids = this.selectedDashboardWidgets.map(widget => widget.id);
      } else {
        formattedItem.widget_ids = [];
      }

      return formattedItem;
    },
    saveDashboardsToStorage() {
      this.$modules.auth.settings.saveSetting(STORAGE_DASHBOARDS_KEY, this.dashboardList);
    },
    addDashboard(item) {
      this.dashboardList.push(item);
      this.saveDashboardsToStorage();
      return item;
    },
    changeDashboard(item) {
      const dashboard = this.$utils.object.clone(item);

      this.dashboardList = this.dashboardList.map(dashboardItem => {
        if (dashboardItem.id === dashboard.id) {
          return dashboard;
        }
        const formattedDashboard = this.$utils.object.clone(dashboardItem);
        delete formattedDashboard.data;

        return formattedDashboard;
      });
      this.saveDashboardsToStorage();

      return dashboard;
    },
    deleteDashboard(item) {
      this.dashboardList = this.dashboardList.filter(dashboard => dashboard.id !== item.id);
      this.saveDashboardsToStorage();
    },
    handleSaveDashboard(item) {
      try {
        this.isLoading = true;

        const formattedItem = this.setDashboardSettings(item);
        const storedItem = typeof item.id === 'number' ? this.changeDashboard(formattedItem) : this.addDashboard(formattedItem);
        this.setSelectedDashboard(storedItem);

        this.isLoading = false;
      } catch (e) {
        this.$uiNotify.error(this.t('Ошибка при сохранении'));
        this.isLoading = false;
        throw e;
      }
    },
    handleChangeSelectedDashboard(dashboardId) {
      const changingDashboard = this.dashboardList.find(dashboard => dashboard.id === dashboardId);
      if (this.$utils.object.isObject(changingDashboard)) {
        this.$refs.sidebar.hide();
        this.setSelectedDashboard(changingDashboard);
      }
    },
    deleteWidgetsByIds(ids) {
      this.widgetList = this.widgetList.filter(widget => !ids.includes(widget.id));
      this.saveWidgetsToStorage();
    },
    async handleDeleteDashboard(dashboardId) {
      this.isLoading = true;
      const dashboardIndex = this.dashboardList.findIndex(dashboard => dashboard.id === dashboardId);
      if (dashboardIndex === -1) {
        return;
      }

      this.deleteWidgetsByIds(this.dashboardList[dashboardIndex].widget_ids);
      this.deleteDashboard(this.dashboardList[dashboardIndex]);

      if (this.dashboardList.length > 0) {
        this.setSelectedDashboard(this.dashboardList[0]);
      }
      this.isLoading = false;
      this.$uiNotify.success(this.t('Дашборд удален'));
    },

    async handleSidebarOpen(widget, needValidate = false) {
      if (typeof widget === 'object') {
        this.selectedWidget = widget;
      }
      await this.$refs.sidebar.open(needValidate);
    },
    handleSidebarHide() {
      this.selectedWidget = this.$utils.object.clone(DEFAULT_WIDGET);
    },
    async handleSaveWidget(item) {
      this.isLoading = true;
      const changingWidgetIndex = this.selectedDashboardWidgets.findIndex(widget => widget.id === item.id);
      if (changingWidgetIndex === -1) {
        return;
      }

      this.selectedDashboardWidgets[changingWidgetIndex] = item;
      this.changeWidget(item);
      updateList(this.widgetList, item);
      this.$uiNotify.success(this.t('Данные сохранены'));
      this.isLoading = false;
    },
    async handleDeleteWidget(item) {
      this.isLoading = true;
      this.selectedDashboardWidgets = this.selectedDashboardWidgets.filter(widget => widget.id !== item.id);

      this.deleteWidget(item);
      this.handleSaveDashboard(this.selectedDashboard);

      this.$uiNotify.success(this.t('Данные сохранены'));
    },
    async handleSaveWidgetsOrder(newOrderWidgetIds) {
      newOrderWidgetIds.forEach((widgetId, index) => {
        const changingWidget = this.selectedDashboardWidgets.find(widget => widget.id === widgetId);
        changingWidget.order = index + 1;
      });
      this.saveWidgetsToStorage();

      this.$uiNotify.success(this.t('Данные сохранены'));
    },

    addWidget(item) {
      this.widgetList.push(item);
      this.saveWidgetsToStorage();
      return item;
    },
    changeWidget(item) {
      const widget = this.$utils.object.clone(item);
      delete widget.data;
      delete widget.configuration;
      delete widget.loading;

      this.widgetList = this.widgetList.map(widgetItem => {
        if (widgetItem.id === widget.id) {
          return widget;
        }
        const formattedWidget = this.$utils.object.clone(widgetItem);
        delete formattedWidget.data;
        delete formattedWidget.configuration;

        return formattedWidget;
      });

      this.saveWidgetsToStorage();

      return widget;
    },
    deleteWidget(item) {
      this.widgetList = this.widgetList.filter(widget => widget.id !== item.id);
      this.saveWidgetsToStorage();
    },
    saveWidgetsToStorage() {
      this.$modules.auth.settings.saveSetting(STORAGE_WIDGETS_KEY, this.widgetList);
    },
    async handleUpdateWidget(item) {
      let widget = this.$utils.object.clone(item);

      if (!Array.isArray(this.widgetList) || this.widgetList.length === 0) {
        widget.id = 0;
        widget.order = 1;
        this.selectedDashboardWidgets = [widget];
      } else if (typeof item.id !== 'number') {
        const lastId = getMaxIdNumber(this.widgetList);
        widget.id = typeof lastId === 'number' ? lastId + 1 : 0;
        widget.order = Math.max(...this.selectedDashboardWidgets.map(item => item.order)) + 1;
        this.selectedDashboardWidgets.push(widget);
      } else {
        const selectedWidgetIndex = this.selectedDashboardWidgets.findIndex(widget => widget.id === item.id);
        if (selectedWidgetIndex === -1) {
          this.$uiNotify.error(this.t('Ошибка при сохранении'));
          return;
        }

        this.selectedDashboardWidgets[selectedWidgetIndex] = item;
      }

      if (typeof item.id === 'number') {
        this.changeWidget(widget);
      } else {
        this.addWidget(widget);
      }
      this.handleSaveDashboard(this.selectedDashboard);
    },
    handleDataLoading(value) {
      this.isLoading = value;
    },
  },
};
</script>

<style lang="less">
.el-popover {
  word-break: normal;
}
</style>
