<template>
  <div>
    <div class="toolbar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
        end-placeholder="结束日期" value-format="YYYY-MM-DD" style="margin-right:8px" @change="fetchData" />
      <el-button type="primary" @click="fetchData">刷新</el-button>
      <el-button @click="exportData">导出Excel</el-button>
    </div>

    <!-- 总体及时率 -->
    <el-row :gutter="16" style="margin-bottom:20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:36px;font-weight:bold;color:#409eff">{{ overallRate.on_time_rate || 0 }}%</div>
            <div style="color:#909399;margin-top:8px">总体及时率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:36px;font-weight:bold;color:#67c23a">{{ overallRate.total_orders || 0 }}</div>
            <div style="color:#909399;margin-top:8px">完成工单总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:36px;font-weight:bold;color:#e6a23c">{{ overallRate.on_time_orders || 0 }}</div>
            <div style="color:#909399;margin-top:8px">及时完成数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:36px;font-weight:bold;color:#f56c6c">{{ overallRate.overdue_orders || 0 }}</div>
            <div style="color:#909399;margin-top:8px">超时工单数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 人员及时率列表 -->
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="staff_name" label="维修人员" width="120" />
      <el-table-column prop="total_orders" label="完成总数" width="100" />
      <el-table-column prop="on_time_orders" label="及时完成" width="100">
        <template #default="{ row }"><span style="color:#67c23a">{{ row.on_time_orders }}</span></template>
      </el-table-column>
      <el-table-column prop="overdue_orders" label="超时完成" width="100">
        <template #default="{ row }"><span style="color:#f56c6c">{{ row.overdue_orders }}</span></template>
      </el-table-column>
      <el-table-column prop="on_time_rate" label="及时率" width="100">
        <template #default="{ row }">
          <el-progress :percentage="Number(row.on_time_rate || 0)" :color="rateColor(row.on_time_rate)" />
        </template>
      </el-table-column>
      <el-table-column prop="avg_response_hours" label="平均响应(小时)" width="130" />
      <el-table-column prop="avg_completion_hours" label="平均完成(小时)" width="130" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dispatchApi } from '../api'
const tableData = ref([])
const overallRate = ref({})
const loading = ref(false)
const dateRange = ref([])

const rateColor = (rate) => {
  const r = Number(rate || 0)
  if (r >= 90) return '#67c23a'
  if (r >= 70) return '#e6a23c'
  return '#f56c6c'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (dateRange.value?.length === 2) { params.start_date = dateRange.value[0]; params.end_date = dateRange.value[1] }
    const [rateRes, listRes] = await Promise.all([
      dispatchApi.timelyRate( { params }),
      dispatchApi.staffRate( { params })
    ])
    overallRate.value = rateRes.data || {}
    tableData.value = listRes.data.data || listRes.data || []
  } catch (e) {
    // fallback to main endpoint
    try {
      const res = await dispatchApi.timelyRate( {
        params: dateRange.value?.length === 2 ? { start_date: dateRange.value[0], end_date: dateRange.value[1] } : {}
      })
      tableData.value = res.data.data || res.data || []
      overallRate.value = { on_time_rate: res.data.on_time_rate || 0, total_orders: res.data.total || 0 }
    } catch (e2) { ElMessage.error('加载失败') }
  } finally { loading.value = false }
}
const exportData = () => ElMessage.info('导出功能待接入')
onMounted(fetchData)
</script>
