<template>
  <div class="settings-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="资产管理" name="assets">
        <AssetList />
      </el-tab-pane>
      <el-tab-pane label="分类管理" name="categories">
        <CategoryList />
      </el-tab-pane>
      <el-tab-pane label="区域管理" name="regions">
        <RegionList />
      </el-tab-pane>
      <el-tab-pane label="使用单位" name="useUnits">
        <UseUnitList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AssetList from './assets/AssetList.vue'
import CategoryList from './assets/CategoryList.vue'
import RegionList from './settings/RegionList.vue'
import UseUnitList from './settings/UseUnitList.vue'

const activeTab = ref('assets')
</script>

<style scoped>
.settings-container {
  padding: 0;
}
</style>
