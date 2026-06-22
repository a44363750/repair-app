<template>
  <el-card>
    <template #header>
      <span>资产操作记录</span>
    </template>
    
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="asset.asset_code" label="资产编码" width="120" />
      <el-table-column prop="asset.name" label="资产名称" />
      <el-table-column prop="operation_type" label="操作类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getType(row.operation_type)">{{ getText(row.operation_type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="操作内容" />
      <el-table-column prop="created_at" label="操作时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { assetApi } from '../../api'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')

const getType = (type) => {
  const map = { create: 'success', update: 'primary', delete: 'danger' }
  return map[type] || 'info'
}

const getText = (type) => {
  const map = { create: '新增', update: '修改', delete: '删除' }
  return map[type] || type
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await assetApi.list({ limit: 100 })
    // 获取所有资产的操作记录
    const operations = []
    for (const asset of res.items) {
      const ops = await assetApi.getOperations(asset.id)
      operations.push(...ops)
    }
    tableData.value = operations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>