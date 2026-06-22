<template>
  <div>
    <div class="toolbar">
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width:140px;margin-right:8px">
        <el-option label="待派工" value="pending" />
        <el-option label="已派工" value="assigned" />
        <el-option label="维修中" value="in_progress" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-button type="primary" @click="fetchData">刷新</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="order_no" label="工单号" width="120" />
      <el-table-column prop="asset_code" label="资产编号" width="120" />
      <el-table-column prop="fault_description" label="故障描述" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reporter_name" label="报修人" width="90" />
      <el-table-column prop="created_at" label="报修时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button size="small" type="primary" @click="showDispatch(row)">派工</el-button>
          </template>
          <template v-else-if="row.status === 'assigned'">
            <el-button size="small" @click="showDispatch(row, true)">改派</el-button>
          </template>
          <template v-if="row.status === 'in_progress'">
            <el-button size="small" type="success" @click="showComplete(row)">完工</el-button>
          </template>
          <el-button size="small" @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />

    <!-- 派工/改派弹窗 -->
    <el-dialog v-model="dispatchDialogVisible" :title="isReassign ? '改派工单' : '派工'" width="500px">
      <el-form :model="dispatchForm" label-width="90px">
        <el-form-item label="工单号"><el-input v-model="dispatchForm.order_no" disabled /></el-form-item>
        <el-form-item label="故障描述"><el-input v-model="dispatchForm.fault_description" type="textarea" disabled /></el-form-item>
        <el-form-item label="选择人员">
          <el-select v-model="dispatchForm.staff_id" placeholder="请选择维修人员" style="width:100%">
            <el-option v-for="s in availableStaff" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitDispatch">确认{{ isReassign ? '改派' : '派工' }}</el-button>
      </template>
    </el-dialog>

    <!-- 完工弹窗 -->
    <el-dialog v-model="completeDialogVisible" title="完工录入" width="500px">
      <el-form :model="completeForm" label-width="90px">
        <el-form-item label="工单号"><el-input v-model="completeForm.order_no" disabled /></el-form-item>
        <el-form-item label="完成时间"><el-date-picker v-model="completeForm.completion_time" type="datetime" style="width:100%" /></el-form-item>
        <el-form-item label="满意度">
          <el-rate v-model="completeForm.satisfaction_score" show-text :texts="['非常不满','不满意','一般','满意','非常满意']" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="completeForm.remarks" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitComplete">确认完工</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dispatchApi, maintenanceStaffApi } from '../api'
const tableData = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const statusFilter = ref('')
const dispatchDialogVisible = ref(false), completeDialogVisible = ref(false)
const isReassign = ref(false)
const availableStaff = ref([])
const dispatchForm = ref({ order_id: null, order_no: '', fault_description: '', staff_id: null })
const completeForm = ref({ order_id: null, order_no: '', completion_time: null, satisfaction_score: 5, remarks: '' })

const statusMap = { pending: '待派工', assigned: '已派工', in_progress: '维修中', completed: '已完成' }
const statusTypeMap = { pending: 'warning', assigned: 'primary', in_progress: 'info', completed: 'success' }
const statusLabel = (s) => statusMap[s] || s
const statusType = (s) => statusTypeMap[s] || ''
const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await dispatchApi.orders( { params })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}

const showDispatch = async (row, reassign = false) => {
  isReassign.value = reassign
  dispatchForm.value = { order_id: row.id, order_no: row.order_no, fault_description: row.fault_description, staff_id: null }
  const staffRes = await dispatchApi.availableStaff()
  availableStaff.value = staffRes.data.data || staffRes.data || []
  dispatchDialogVisible.value = true
}
const submitDispatch = async () => {
  await dispatchApi.assign( { order_id: dispatchForm.value.order_id, staff_id: dispatchForm.value.staff_id })
  dispatchDialogVisible.value = false
  fetchData()
  ElMessage.success(isReassign.value ? '改派成功' : '派工成功')
}
const showComplete = (row) => {
  completeForm.value = { order_id: row.id, order_no: row.order_no, completion_time: new Date(), satisfaction_score: 5, remarks: '' }
  completeDialogVisible.value = true
}
const submitComplete = async () => {
  await axios.post(`/api/dispatch/complete/${completeForm.value.order_id}`, {
    completion_time: completeForm.value.completion_time,
    satisfaction_score: completeForm.value.satisfaction_score,
    remarks: completeForm.value.remarks
  })
  completeDialogVisible.value = false
  fetchData()
  ElMessage.success('完工登记成功')
}
const viewDetail = (row) => ElMessage.info(`查看工单 ${row.order_no} 详情（待开发）`)

onMounted(fetchData)
</script>
