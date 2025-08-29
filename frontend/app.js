export default {
  modules: {
    menu: {
      items: [
        {
          id: 'plugin-custom-dashboard',
          title: window.t('Настраиваемые дашборды'),
          icon: 'chart-growth',
          url: {
            route: 'plugin-custom-dashboard.customDashboard',
          },
          order: 100,
        },
      ],
    },
  },
};
