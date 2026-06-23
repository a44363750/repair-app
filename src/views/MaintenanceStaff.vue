<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showDialog('add')">新增维修人员</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="employee_id" label="员工ID" width="80" />
      <el-table-column prop="employee_name" label="姓名" width="100" />
      <el-table-column prop="specialty" label="专长" />
      <el-table-column prop="phone" label="联系电话" width="120" />
      <el-table-column prop="is_active" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '在职' : '离职' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="showDialog('edit', row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="员工ID"><el-input v-model="form.employee_id" type="number" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="专长"><el-input v-model="form.specialty" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="是否在职">
          <el-switch v-model="form.is_active" />
        </el-form-item>
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
import { maintenanceStaffApi } from '../api'
const tableData = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增维修人员')
const form = ref({ id: null, employee_id: null, name: '', specialty: '', phone: '', is_active: true })

const fetchData = async () => {
  loading.value = true
  try {
    const res = await maintenanceStaffApi.list( { page: page.value, page_size: pageSize.value })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
const showDialog = (mode, row = {}) => {
  dialogTitle.value = mode === 'add' ? '新增维修人员' : '编辑维修人员'
  form.value = mode === 'add' ? { employee_id: null, role: 'technician', specialty: '', phone: '' }
    : { id: row.id, employee_id: row.employee_id, role: row.role || 'technician', specialty: row.specialty || '', phone: row.phone || '' }
  dialogVisible.value = true
}
const handleSave = async () => {
  if (form.value.id) await maintenanceStaffApi.update(form.value.id, { employee_id: form.value.employee_id, specialty: form.value.specialty, phone: form.value.phone, role: form.value.role || 'technician' })
  else await maintenanceStaffApi.create({ employee_id: form.value.employee_id, specialty: form.value.specialty, phone: form.value.phone, role: form.value.role || 'technician' })
  dialogVisible.value = false; fetchData(); ElMessage.success('保存成功')
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await axios.delete(`/api/maintenance-staff/${id}`); fetchData(); ElMessage.success('删除成功')
}
onMounted(fetchData)
</script>
