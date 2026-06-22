<template>
  <el-card>
    <template #header>
      <span>报修管理</span>
    </template>
    
    <el-form inline>
      <el-form-item label="状态">
        <el-select v-model="search.status" placeholder="全部" clearable @change="loadData">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="handling" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">搜索</el-button>
      </el-form-item>
    </el-form>
    
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="设备">
        <template #default="{ row }">
          {{ row.asset?.name }} ({{ row.asset?.asset_code }})
        </template>
      </el-table-column>
      <el-table-column prop="fault_description" label="故障描述" :show-overflow-tooltip="true" />
      <el-table-column prop="urgency_level" label="紧急程度" width="80">
        <template #default="{ row }">
          <el-tag :type="getUrgencyType(row.urgency_level)" size="small">
            {{ getUrgencyText(row.urgency_level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleRepair(row)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, prev, pager, next"
      @change="loadData"
      style="margin-top: 20px; justify-content: flex-end"
    />
    
    <el-dialog v-model="dialogVisible" title="处理报修" width="500px">
      <el-form :model="form" ref="formRef" label-width="100px">
        <el-form-item label="处理人">
          <el-select v-model="form.handler_id" placeholder="请选择" style="width: 100%">
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="form.handle_remarks" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="处理结果">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="处理中" value="handling" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { repairApi, employeeApi } from '../../api'

const loading = ref(false)
const tableData = ref([])
const employees = ref([])
const search = reactive({ status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const dialogVisible = ref(false)
const editId = ref(null)
const form = reactive({ handler_id: null, handle_remarks: '', status: 'completed' })
const formRef = ref()

const getUrgencyType = (level) => {
  const map = { low: 'info', normal: 'primary', high: 'warning', urgent: 'danger' }
  return map[level] || 'info'
}
const getUrgencyText = (level) => {
  const map = { low: '低', normal: '普通', high: '高', urgent: '紧急' }
  return map[level] || level
}
const getStatusType = (status) => {
  const map = { pending: 'warning', handling: 'primary', completed: 'success', cancelled: 'info' }
  return map[status] || 'info'
}
const getStatusText = (status) => {
  const map = { pending: '待处理', handling: '处理中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await repairApi.list({ ...search, page: pagination.page, page_size: pagination.pageSize })
    tableData.value = res
    pagination.total = res.length
  } finally {
    loading.value = false
  }
}

const handleRepair = (row) => {
  editId.value = row.id
  Object.assign(form, { handler_id: null, handle_remarks: '', status: 'completed' })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await repairApi.handle(editId.value, form)
    ElMessage.success('处理成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '处理失败')
  }
}

onMounted(async () => {
  employees.value = await employeeApi.list()
  loadData()
})
</script>