<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showDialog">新增调度人员</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="employee_id" label="员工ID" width="100" />
      <el-table-column prop="is_active" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '在职' : '离职' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row.id)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />
    <el-dialog v-model="dialogVisible" title="新增调度人员" width="400px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="员工ID"><el-input v-model="form.employee_id" type="number" /></el-form-item>
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
import { dispatcherApi } from '../api'
const tableData = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const dialogVisible = ref(false)
const form = ref({ employee_id: null })
const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'
const fetchData = async () => {
  loading.value = true
  try {
    const res = await dispatcherApi.list( { page: page.value, page_size: pageSize.value })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
const showDialog = () => { form.value = { employee_id: null }; dialogVisible.value = true }
const handleSave = async () => {
  await dispatcherApi.create( form.value)
  dialogVisible.value = false; fetchData(); ElMessage.success('添加成功')
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认移除？', '提示', { type: 'warning' })
  await axios.delete(`/api/dispatchers/${id}`); fetchData(); ElMessage.success('移除成功')
}
onMounted(fetchData)
</script>
