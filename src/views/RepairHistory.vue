<template>
  <div>
    <div class="toolbar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始"
        end-placeholder="结束" value-format="YYYY-MM-DD" style="margin-right:8px" @change="fetchData" />
      <el-input v-model="keyword" placeholder="工单号/资产编号" style="width:180px;margin-right:8px" clearable />
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="order_no" label="工单号" width="150" />
      <el-table-column prop="asset_code" label="资产编号" width="130" />
      <el-table-column prop="fault_description" label="故障描述" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="maintenance_type" label="维修方式" width="90" />
      <el-table-column prop="staff_name" label="维修人员" width="100" />
      <el-table-column prop="completed_at" label="完成时间" width="160">
        <template #default="{ row }">{{ formatDate(row.completed_at) }}</template>
      </el-table-column>
      <el-table-column prop="satisfaction_score" label="满意度" width="90">
        <template #default="{ row }">
          <el-rate v-model="row.satisfaction_score" disabled size="small" />
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dispatchApi } from '../api'
const tableData = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const dateRange = ref([]), keyword = ref('')
const statusMap = { pending: '待派工', assigned: '已派工', in_progress: '维修中', completed: '已完成' }
const statusType = (s) => ({ pending: 'warning', assigned: 'primary', in_progress: 'info', completed: 'success' }[s] || '')
const statusText = (s) => statusMap[s] || s
const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'
const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value, status: 'completed' }
    if (dateRange.value?.length === 2) { params.start_date = dateRange.value[0]; params.end_date = dateRange.value[1] }
    if (keyword.value) params.keyword = keyword.value
    const res = await dispatchApi.orders( { params })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
onMounted(fetchData)
</script>
