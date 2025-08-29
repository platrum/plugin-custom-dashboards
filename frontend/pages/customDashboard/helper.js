import { UNKNOWN_VALUE_TEXT, WIDGET_MODULES, WIDGET_TYPES } from './const';

export function getMaxIdNumber(array) {
  return array.length > 0 ? Math.max(...array.map(item => item.id)) : null;
}

export function updateList(list, ...items) {
  items.forEach(item => {
    const currentItemIndex = list.findIndex(listItem => listItem.id === item.id);
    if (currentItemIndex === -1) {
      list.push(item);
      return;
    }

    list[currentItemIndex] = item;
  });
}

export function getWidgetConfiguration(widget, groupFields, metrics, filterPresets) {
  const widgetType = WIDGET_TYPES.find(type => type.key === widget.type);
  const widgetTypeName = typeof widgetType === 'object' ? widgetType.name : '';
  const widgetModule = WIDGET_MODULES.find(module => module.key === widget.module);
  const widgetModuleName = typeof widgetModule === 'object' ? widgetModule.name : '';
  const widgetGroup = groupFields.find(group => group.key === widget.group);
  const widgetGroupName = typeof widgetGroup === 'object' ? widgetGroup.name : '';
  const widgetMetric = metrics.find(metric => metric.key === widget.metric);
  const widgetMetricName = typeof widgetMetric === 'object' ? widgetMetric.name : '';
  const widgetFilter = filterPresets.find(filter => filter.key === widget.filter_preset_key);
  const widgetFilterName = typeof widgetFilter === 'object' ? widgetFilter.name : '';

  return `${widgetTypeName} ${window.t('по модулю')} "${widgetModuleName}":
  ${window.t('группировка по полю')} "${widgetGroupName}"
  ${window.t('по метрике')} "${widgetMetricName}"
  ${typeof widgetFilterName === 'string' && widgetFilterName.length > 0 ? `${window.t('с фильтром')} "${widgetFilterName}"` : window.t('без фильтра')}`;
}

export async function getDataWithPanelNames(data, platform) {
  const boards = await platform.api.requestRoute('tasks.api.board.list');
  const panels = boards.map(board => board.panels).flat().filter(panel => !panel.is_archived);
  const newData = {};
  Object.keys(data).forEach(panel_id => {
    const panel = panels.find(panel => panel.id === parseInt(panel_id));
    const panelName = typeof panel === 'object' ? panel.name : UNKNOWN_VALUE_TEXT;
    newData[panelName] = data[panel_id];
  });

  return newData;
}

export async function getDataWithStatusNames(data, platform) {
  const statuses = await platform.api.requestRoute('lists.api.item.list', { list: 'tasks.status' });
  const newData = {};
  Object.keys(data).forEach(status_key => {
    const status = statuses.find(status => status.key === status_key);
    const statusName = typeof status === 'object' ? status.name : UNKNOWN_VALUE_TEXT;
    newData[statusName] = data[status_key];
  });

  return newData;
}

export function getDashboardGroup(item, userId) {
  if (item.owner_user_id === userId) {
    return 'my-dashboards';
  }
  if (item.is_public) {
    return 'access-dashboards';
  }
  return 'other-dashboards';
}
