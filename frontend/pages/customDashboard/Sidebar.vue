<template>
  <ui-sidebar
    v-model="isSidebarVisible"
    :title="isNewWidget ? t('Добавление виджета') : t('Редактирование виджета')"
    class="sidebar"
    @hide="hide"
  >
    <el-form class="content" ref="form" :model="item" label-width="150px">
      <el-form-item
        :label="t('Название виджета')"
        prop="name"
        :rules="[{ required: true, message: t('Введите название виджета')}]"
      >
        <el-input v-model="item.name" :placeholder="t('Введите название виджета')" />
      </el-form-item>

      <el-form-item
        v-if="WIDGET_TYPES.length > 1"
        :label="t('Тип виджета')"
        prop="type"
        :rules="[{ required: true, message: t('Выберите тип виджета')}]"
      >
        <ui-element-select
          v-model="item.type"
          :placeholder="t('Выберите тип виджета')"
          style="width: 370px"
          filterable
        >
          <el-option
            v-for="type in WIDGET_TYPES"
            :key="type.key"
            :label="t(type.name)"
            :value="type.key"
          />
        </ui-element-select>
      </el-form-item>

      <el-form-item
        v-if="WIDGET_MODULES.length > 1"
        :label="t('Модуль')"
        prop="module"
        :rules="[{ required: true, message: t('Выберите модуль')}]"
      >
        <ui-element-select
          v-model="item.module"
          :placeholder="t('Выберите модуль')"
          style="width: 370px"
          filterable
        >
          <el-option
            v-for="module in WIDGET_MODULES"
            :key="module.key"
            :label="t(module.name)"
            :value="module.key"
          />
        </ui-element-select>
      </el-form-item>

      <el-form-item
        :label="t('Группировка')"
        prop="group"
        :rules="[{ required: true, message: t('Выберите группировку')}]"
      >
        <ui-element-select
          v-model="item.group"
          :placeholder="t('Выберите группировку')"
          style="width: 370px"
          filterable
        >
          <el-option
            v-for="group in groupFields"
            :key="group.key"
            :label="t(group.name)"
            :value="group.key"
          />
        </ui-element-select>
      </el-form-item>

      <el-form-item
        :label="t('Фильтр')"
        prop="filter_preset_key"
        :rules="[{ required: true, message: t('Выберите фильтр') }]"
      >
        <ui-element-select
          v-model="item.filter_preset_key"
          :placeholder="t('Выберите фильтр')"
          style="width: 370px"
          filterable
        >
          <el-option
            v-for="filter in filters"
            :key="filter.key"
            :label="t(filter.name)"
            :value="filter.key"
          />
        </ui-element-select>
      </el-form-item>

      <el-form-item
        :label="t('Метрика')"
        prop="metric"
        :rules="[{ required: true, message: t('Выберите метрику') }]"
      >
        <ui-element-select
          v-model="item.metric"
          :placeholder="t('Выберите метрику')"
          style="width: 370px"
          filterable
        >
          <el-option
            v-for="metric in metrics"
            :key="metric.key"
            :label="t(metric.name)"
            :value="metric.key"
          />
        </ui-element-select>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          size="small"
          @click="submit"
        >
          <span>{{ isNewWidget ? t('Добавить') : t('Сохранить') }}</span>
        </el-button>

        <el-button size="small" @click="hide">
          <span>Отмена</span>
        </el-button>
      </el-form-item>
    </el-form>
  </ui-sidebar>
</template>

<script>
import { WIDGET_MODULES, WIDGET_TYPES } from './const';

export default {
  props: {
    value: Object,
    groupFields: {
      type: Array,
      default: [],
    },
    metrics: {
      type: Array,
      default: [],
    },
    filters: {
      type: Array,
      default: [],
    },
  },
  data() {
    return {
      WIDGET_TYPES,
      WIDGET_MODULES,

      isSidebarVisible: false,
      item: {},
    };
  },
  computed: {
    isNewWidget() {
      return this.item.id === null;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.item = this.$utils.object.clone(val);
      },
    },
  },
  methods: {
    async open(needValidate = false) {
      if (this.isSidebarVisible) {
        this.isSidebarVisible = false;
      }
      this.isSidebarVisible = true;

      if (needValidate) {
        try {
          await this.$refs.form.validate();
        } catch (e) {}
      } else {
        this.resetState();
      }
    },
    hide() {
      this.resetState();
      this.isSidebarVisible = false;
      this.$emit('hide');
    },
    async submit() {
      try {
        await this.$refs.form.validate();
      } catch (e) {
        this.$uiNotify.error('Заполните необходимые поля');
        return;
      }
      this.$emit('input', this.item);
      this.hide();
    },
    resetState() {
      this.$refs.form.clearValidate();
      this.$refs.form.resetFields();
    },
  },
};
</script>

<style lang="less" scoped>
.sidebar {
  top: 0 !important;
  width: 550px;
  background: white;

  .content {
    padding-right: 30px;

    .text-editor {
      line-height: 20px;
    }
  }
}
</style>
