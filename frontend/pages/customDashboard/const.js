export const DEFAULT_FILTER_KEY = 'no_filter';
export const ITEMS_AMOUNT_METRIC_KEY = 'items_amount';
export const RESPONSIBLE_USER_IDS_METRIC_KEY = 'responsible_user_ids';
export const OWNER_USER_ID_METRIC_KEY = 'owner_user_id';
export const BOARD_PANEL_ID_METRIC_KEY = 'board_panel_id';
export const STATUS_METRIC_KEY = 'status_key';

export const UNKNOWN_VALUE_TEXT = window.t('Неизвестное значение');

export const DEFAULT_WIDGET_WIDTH = 6;
export const DEFAULT_WIDGET_HEIGHT = 4;
export const TOOLBAR_WIDGET_HEIGHT = 40;
export const WIDGET_LABEL_WIDTH = 40;
export const WIDGET_DATA_MULTIPLIER = 100;

export const DEFAULT_DASHBOARD = {
    id: null,
    name: null,
    column_count: 12,
    owner_user_id: '',
    is_public: false,
    is_favourite: false,
    refresh_interval: 60,
    widget_ids: [],
};

export const DEFAULT_WIDGET = {
    name: null,
    id: null,
    group: null,
    metric: null,
    module: 'tasks',
    type: 'bars',
    filter_preset_key: null,
    order: 1,
    size_width: DEFAULT_WIDGET_WIDTH,
    size_height: DEFAULT_WIDGET_HEIGHT,
    is_hide_left_bar: false,
};

export const WIDGET_TYPES = [{ key: 'bars', name: window.t('Столбчатая диаграмма') }];
export const WIDGET_MODULES = [{ key: 'tasks', name: window.t('Задачи') }];
export const WIDGET_GROUP_FIELDS = [
    { key: BOARD_PANEL_ID_METRIC_KEY, name: window.t('Колонка доски') },
    { key: OWNER_USER_ID_METRIC_KEY, name: window.t('Постановщик') },
    { key: 'product', name: window.t('Продукт') },
    { key: RESPONSIBLE_USER_IDS_METRIC_KEY, name: window.t('Исполнитель') },
    { key: STATUS_METRIC_KEY, name: window.t('Статус') },
];
export const WIDGET_METRICS = [
    { key: ITEMS_AMOUNT_METRIC_KEY, name: window.t('Количество') },
    { key: 'time_fact', name: window.t('Фактическое время') },
    { key: 'time_plan', name: window.t('Планируемое время') },
];

export const DASHBOARD_GROUPS = [
    {
        name: window.t('Мои дашборды'),
        type: 'my-dashboards',
        icon: 'user',
        sort: 10,
        showUserInfo: false,
    },
    {
        name: window.t('Выданные мне'),
        type: 'access-dashboards',
        icon: 'users',
        sort: 20,
        showUserInfo: true,
    },
    {
        name: window.t('Остальные'),
        type: 'other-dashboards',
        icon: 'el-icon-more-outline',
        sort: 30,
        showUserInfo: true,
        collapsed: true,
    },
];

export const DEFAULT_DASHBOARD_SIZES = [3, 4, 6, 12];
export const LEFT_MENU_WIDTH = 270;
export const DASHBOARD_PADDING = 20;
export const DEFAULT_DASHBOARD_COLUMN = 190;
export const MILLISECONDS_IN_SECOND = 1000;

export const STORAGE_DASHBOARDS_KEY = 'plugin-custom-dashboard.dashboards';
export const STORAGE_WIDGETS_KEY = 'plugin-custom-dashboard.widgets';
export const STORAGE_LAST_ACTIVE_DASHBOARD_ID_KEY = 'plugin-custom-dashboard.last-active-dashboard-id';
