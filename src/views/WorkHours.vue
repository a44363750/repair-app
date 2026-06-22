<template>
  <div>
    <div class="toolbar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
        end-placeholder="结束日期" value-format="YYYY-MM-DD" style="margin-right:8px" @change="fetchData" />
      <el-button type="primary" @click="showDialog">录入工时</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="order_no" label="工单号" width="130" />
      <el-table-column prop="staff_name" label="维修人员" width="100" />
      <el-table-column prop="work_date" label="工作日期" width="110">
        <template #default="{ row }">{{ row.work_date?.slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column prop="hours" label="工时数" width="80" />
      <el-table-column prop="work_content" label="工作内容" show-overflow-tooltip />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />
    <el-dialog v-model="dialogVisible" title="录入工时" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="工单ID"><el-input v-model="form.repair_order_id" type="number" /></el-form-item>
        <el-form-item label="维修人员">
          <el-select v-model="form.staff_id" style="width:100%">
            <el-option v-for="s in staffList" :key="s.id" :label="s.employee_name || s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工作日期"><el-date-picker v-model="form.work_date" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="工时数"><el-input v-model="form.hours" type="number" /></el-form-item>
        <el-form-item label="工作内容"><el-input v-model="form.work_content" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workHourApi, maintenanceStaffApi } from '../api'
const tableData = ref([]), staffList = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const dateRange = ref([])
const dialogVisible = ref(false)
const form = ref({ repair_order_id: null, staff_id: null, work_date: null, hours: 0, work_content: '' })

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (dateRange.value?.length === 2) { params.start_date = dateRange.value[0]; params.end_date = dateRange.value[1] }
    const res = await workHourApi.list( { params })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
const handleSave = async () => {
  await workHourApi.create( form.value)
  dialogVisible.value = false; fetchData(); ElMessage.success('录入成功')
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await axios.delete(`/api/work-hours/${id}`); fetchData(); ElMessage.success('删除成功')
}
const showDialog = async () => {
  const res = await maintenanceStaffApi.list()
  staffList.value = res.data.data || res.data || []
  form.value = { repair_order_id: null, staff_id: null, work_date: new Date(), hours: 0, work_content: '' }
  dialogVisible.value = true
}
onMounted(fetchData)
</script>
