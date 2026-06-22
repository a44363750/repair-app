<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="资产编号/报修人/电话" style="width:200px;margin-right:8px" clearable @keyup.enter="fetchData" />
      <el-select v-model="statusFilter" placeholder="状态" clearable style="width:130px;margin-right:8px">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="handling" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="order_no" label="工单号" width="150" />
      <el-table-column prop="asset_code" label="资产编号" width="130" />
      <el-table-column prop="fault_description" label="故障描述" show-overflow-tooltip />
      <el-table-column prop="urgency_level" label="紧急" width="70">
        <template #default="{ row }">
          <el-tag :type="urgencyType(row.urgency_level)" size="small">{{ urgencyText(row.urgency_level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reporter_name" label="报修人" width="90" />
      <el-table-column prop="contact_phone" label="电话" width="110" />
      <el-table-column prop="created_at" label="报修时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { repairApi } from '../api'
const tableData = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const keyword = ref(''), statusFilter = ref('')
const urgencyMap = { low: '一般', medium: '紧急', high: '加急' }
const statusMap = { pending: '待处理', handling: '处理中', completed: '已完成' }
const urgencyType = (u) => ({ low: 'info', medium: 'warning', high: 'danger' }[u] || '')
const statusType = (s) => ({ pending: 'warning', handling: 'primary', completed: 'success' }[s] || '')
const urgencyText = (u) => urgencyMap[u] || u
const statusText = (s) => statusMap[s] || s
const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'
const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await repairApi.list( { params })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
onMounted(fetchData)
</script>
