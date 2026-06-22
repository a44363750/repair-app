<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showDialog('add')">新增区域</el-button>
    </div>
    <el-table :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="区域名称" />
      <el-table-column prop="code" label="区域编码" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="showDialog('edit', row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page" v-model:page-size="pageSize"
      :total="total" layout="total, prev, pager, next"
      style="margin-top:16px" @current-change="fetchData"
    />
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="区域名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="区域编码"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
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
import { regionApi } from '../../api'
const tableData = ref([])
const page = ref(1), pageSize = ref(20), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增区域')
const form = ref({ id: null, name: '', code: '', description: '' })

const fetchData = async () => {
  const res = await regionApi.list( { page: page.value, page_size: pageSize.value })
  tableData.value = res.data.data || res.data
  total.value = res.data.total || 0
}
const showDialog = (mode, row = {}) => {
  dialogTitle.value = mode === 'add' ? '新增区域' : '编辑区域'
  form.value = mode === 'add' ? { name: '', code: '', description: '' } : { ...row }
  dialogVisible.value = true
}
const handleSave = async () => {
  const payload = { name: form.value.name, code: form.value.code, description: form.value.description }
  if (form.value.id) {
    await axios.put(`/api/regions/${form.value.id}`, payload)
  } else {
    await regionApi.create( payload)
  }
  dialogVisible.value = false
  fetchData()
  ElMessage.success('保存成功')
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await axios.delete(`/api/regions/${id}`)
  fetchData()
  ElMessage.success('删除成功')
}
const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'
onMounted(fetchData)
</script>
