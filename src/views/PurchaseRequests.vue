<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showDialog('add')">新建采购申请</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="request_no" label="申请单号" width="160" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="priority" label="优先级" width="80">
        <template #default="{ row }">
          <el-tag :type="priorityType(row.priority)">{{ priorityLabel(row.priority) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applicant_name" label="申请人" width="100" />
      <el-table-column prop="created_at" label="申请时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="物资名称"><el-input v-model="form.asset_name" /></el-form-item>
        <el-form-item label="数量"><el-input v-model="form.quantity" type="number" /></el-form-item>
        <el-form-item label="单价"><el-input v-model="form.unit_price" type="number" /></el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority" style="width:100%">
            <el-option label="低" value="low" />
            <el-option label="普通" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="期望日期"><el-date-picker v-model="form.expected_date" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remarks" type="textarea" /></el-form-item>
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
import { purchaseRequestApi } from '../api'
const tableData = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新建采购申请')
const form = ref({ id: null, title: '', asset_name: '', quantity: 1, unit_price: 0, priority: 'normal', expected_date: null, remarks: '' })
const priorityMap = { low: '低', normal: '普通', high: '高', urgent: '紧急' }
const statusMap = { pending: '待审批', approved: '已批准', rejected: '已拒绝', purchased: '已采购' }
const priorityType = (p) => ({ low: '', normal: 'success', high: 'warning', urgent: 'danger' }[p] || '')
const statusType = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger', purchased: 'info' }[s] || '')
const priorityLabel = (p) => priorityMap[p] || p
const statusLabel = (s) => statusMap[s] || s
const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'
const fetchData = async () => {
  loading.value = true
  try {
    const res = await purchaseRequestApi.list( { page: page.value, page_size: pageSize.value })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
const showDialog = (mode, row = {}) => {
  dialogTitle.value = mode === 'add' ? '新建采购申请' : '编辑采购申请'
  form.value = mode === 'add' ? { title: '', asset_name: '', quantity: 1, unit_price: 0, priority: 'normal', expected_date: null, remarks: '' } : { ...row }
  dialogVisible.value = true
}
const handleSave = async () => {
  if (form.value.id) await axios.put(`/api/purchase-requests/${form.value.id}`, form.value)
  else await purchaseRequestApi.create( form.value)
  dialogVisible.value = false; fetchData(); ElMessage.success('保存成功')
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await axios.delete(`/api/purchase-requests/${id}`); fetchData(); ElMessage.success('删除成功')
}
onMounted(fetchData)
</script>
