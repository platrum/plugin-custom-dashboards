<template>
  <div v-loading="loading" class="container" :style="chartStyles">
    <div :style="chartStyles">
      <div v-if="isDataEmpty" class="no-data">
        <p class="empty-message">{{ emptyMessage }}</p>
      </div>

      <div v-show="!isDataEmpty && !loading" ref="chart" class="chart" :style="chartStyles" />
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts/core';
import { TooltipComponent, GridComponent, DataZoomComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

import { TOOLBAR_WIDGET_HEIGHT, WIDGET_LABEL_WIDTH } from '../const';

echarts.use([TooltipComponent, GridComponent, DataZoomComponent, BarChart, CanvasRenderer]);

const CHART_TYPE_BAR = 'bar';
const BAR_MAX_WIDTH = 100;
const BAR_CURSOR_DEFAULT = 'default';
const BAR_BORDER_RADIUS = 4;
const BAR_MAX_WIDTH_FOR_ZOOM = 60;
const ZOOM_TYPE_SLIDER = 'slider';
const ZOOM_TYPE_INSIDE = 'inside';
const LABEL_OVERFLOW_TRUNCATE = 'truncate';

const X_AXIS_TYPE_CATEGORY = 'category';
const Y_AXIS_TYPE_VALUE = 'value';
const BAR_COLOR = '#F22F63';

const TOOLTIP_BORDER_COLOR = '#eaebeb';
const TOOLTIP_BORDER_WIDTH = 1;
const TOOLTIP_BOX_SHADOW_STYLE = 'box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);';
const TOOLTIP_TEXT_COLOR = '#52646b';
const TOOLTIP_TEXT_SIZE = 12;
const TOOLTIP_FORMATTER_NAME_AND_VALUE_OF_DATA_ITEM = '{b} <b>{c}</b>';
const TOOLTIP_AXIS_POINTER = 'shadow';

const DEFAULT_CHART_OPTIONS = {
  xAxis: {
    type: X_AXIS_TYPE_CATEGORY,
    boundaryGap: true,
    axisTick: {
      interval: 0,
      alignWithLabel: true,
    },
    axisLabel: {
      interval: 0,
      overflow: LABEL_OVERFLOW_TRUNCATE,
      hideOverlap: true,
    },
  },
  yAxis: {
    type: Y_AXIS_TYPE_VALUE,
    axisLabel: { show: true },
  },
  color: [BAR_COLOR],
  tooltip: {
    borderColor: TOOLTIP_BORDER_COLOR,
    borderWidth: TOOLTIP_BORDER_WIDTH,
    extraCssText: TOOLTIP_BOX_SHADOW_STYLE,
    textStyle: {
      color: TOOLTIP_TEXT_COLOR,
      fontSize: TOOLTIP_TEXT_SIZE,
    },
    trigger: 'axis',
    axisPointer: {
      type: TOOLTIP_AXIS_POINTER,
    },
    formatter: TOOLTIP_FORMATTER_NAME_AND_VALUE_OF_DATA_ITEM,
  },
};

const CHART_DISABLED_DATA_ZOOM = [
  {
    type: ZOOM_TYPE_SLIDER,
    disabled: true,
    show: false,
    zoomLock: true,
    start: 0,
    end: 100,
  },
  {
    type: ZOOM_TYPE_INSIDE,
    disabled: true,
    show: false,
    zoomLock: true,
    start: 0,
    end: 100,
  },
];
const CHART_DATA_ZOOM = [
  {
    type: ZOOM_TYPE_SLIDER,
    disabled: false,
    show: true,
    zoomLock: false,
    start: 25,
    end: 75,
    width: '89%',
    height: 15,
    left: '5%',
    showDetail: false,
    showDataShadow: false,
  },
  {
    type: ZOOM_TYPE_INSIDE,
    disabled: false,
    show: true,
    zoomLock: false,
    start: 94,
    end: 100,
  },
  {
    show: false,
    yAxisIndex: 0,
    filterMode: 'empty',
    width: 20,
    height: '80%',
    showDataShadow: false,
    right: '0',
  },
];

export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
    width: Number,
    height: Number,
    isHideLeftBar: Boolean,
    loading: Boolean,
  },
  mounted() {
    this.barChart = echarts.init(this.$refs.chart);
    this.updateChart();

    window.addEventListener('resize', this.resize);

    this.barChart.on('contextmenu', (params) => {
      params.event.stop();
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resize);
  },
  data() {
    return {
      barChart: null,
      emptyMessage: t('Нет данных'),
      chartOptions: this.$utils.object.clone(DEFAULT_CHART_OPTIONS),
    };
  },
  computed: {
    isChartInitialized() {
      return this.barChart !== null;
    },
    hasData() {
      return typeof this.data === 'object' && this.data !== null;
    },
    isDataEmpty() {
      return !this.hasData || this.dataKeysLength === 0;
    },
    dataKeys() {
      return this.hasData ? Object.keys(this.data) : [];
    },
    dataKeysLength() {
      return this.hasData ? this.dataKeys.length : [];
    },
    chartStyles() {
      return {
        width: `${this.width}px`,
        height: `${this.height - TOOLBAR_WIDGET_HEIGHT}px`,
      };
    },
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      handler(val, prevVal) {
        if (!this.isChartInitialized) {
          return;
        }

        if (!this.$utils.object.isEqual(val, prevVal)) {
          this.updateChart();
          return;
        }

        this.resize();
      }
    },
    width: {
      immediate: true,
      handler() {
        if (this.isChartInitialized) {
          this.updateChart();
        }
      }
    },
    isHideLeftBar: {
      immediate: true,
      handler() {
        if (this.isChartInitialized) {
          this.updateChart();
        }
      }
    },
  },
  methods: {
    updateChart() {
      this.chartOptions.xAxis.data = this.dataKeys;

      this.chartOptions.series = [{
        type: CHART_TYPE_BAR,
        data: Object.values(this.data),
        barMaxWidth: BAR_MAX_WIDTH,
        itemStyle: {
          borderRadius: BAR_BORDER_RADIUS,
        },
        cursor: BAR_CURSOR_DEFAULT,
      }];

      this.chartOptions.yAxis.axisLabel.show = !this.isHideLeftBar;
      const barWidth = (this.width - WIDGET_LABEL_WIDTH) / this.dataKeysLength;
      this.chartOptions.dataZoom = barWidth < BAR_MAX_WIDTH_FOR_ZOOM ? CHART_DATA_ZOOM : CHART_DISABLED_DATA_ZOOM;

      this.barChart.setOption(this.chartOptions);
    },
    resize() {
      this.barChart.resize();
    },
  },
};
</script>

<style lang="less" scoped>
.container {
  background: transparent;
}

.no-data {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-message {
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  line-height: 1.35;
  color: #3C3E53;
}
</style>
