<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>盘点任务</span>
        <el-button type="primary" @click="$router.push('/inventory/create')">新建盘点</el-button>
      </div>
    </template>
    
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="task_name" label="任务名称" />
      <el-table-column label="时间范围">
        <template #default="{ row }">
          {{ formatDate(row.start_date) }} ~ {{ formatDate(row.end_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { inventoryApi } from '../../api'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')

const getStatusType = (status) => {
  const map = { pending: 'info', in_progress: 'warning', completed: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待开始', in_progress: '进行中', completed: '已完成' }
  return map[status] || status
}

const loadData = async () => {
  loading.value = true
  try {
    tableData.value = await inventoryApi.list()
  } finally {
    loading.value = false
  }
}

const viewDetail = (row) => {
  router.push(`/inventory/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该盘点任务吗？', '提示', { type: 'warning' })
    .then(async () => {
      await inventoryApi.delete(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
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