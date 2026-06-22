<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>盘点详情</span>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </template>
    
    <el-descriptions :column="2" border>
      <el-descriptions-item label="任务名称">{{ task.task_name }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(task.status)">{{ getStatusText(task.status) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="开始日期">{{ formatDate(task.start_date) }}</el-descriptions-item>
      <el-descriptions-item label="结束日期">{{ formatDate(task.end_date) }}</el-descriptions-item>
    </el-descriptions>
    
    <el-divider />
    
    <h3>盘点进度</h3>
    <el-progress :percentage="progress" :status="progress === 100 ? 'success' : ''" />
    
    <el-divider />
    
    <h3>盘点资产列表</h3>
    <el-table :data="task.items" border stripe>
      <el-table-column prop="asset.asset_code" label="资产编码" />
      <el-table-column prop="asset.name" label="资产名称" />
      <el-table-column prop="asset.location" label="存放位置" />
      <el-table-column prop="is_checked" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_checked ? 'success' : 'info'">
            {{ row.is_checked ? '已盘点' : '未盘点' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { inventoryApi } from '../../api'
import dayjs from 'dayjs'

const route = useRoute()
const loading = ref(false)
const task = ref({ items: [] })

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : ''

const getStatusType = (status) => {
  const map = { pending: 'info', in_progress: 'warning', completed: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待开始', in_progress: '进行中', completed: '已完成' }
  return map[status] || status
}

const progress = computed(() => {
  if (!task.value.items.length) return 0
  const checked = task.value.items.filter(i => i.is_checked).length
  return Math.round(checked / task.value.items.length * 100)
})

const loadData = async () => {
  loading.value = true
  try {
    task.value = await inventoryApi.get(route.params.id)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>