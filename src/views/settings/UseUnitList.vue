<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showDialog('add')">新增单位</el-button>
    </div>
    <el-table :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="单位名称" />
      <el-table-column prop="code" label="单位编码" />
      <el-table-column prop="contact_person" label="联系人" />
      <el-table-column prop="contact_phone" label="联系电话" />
      <el-table-column prop="address" label="地址" show-overflow-tooltip />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="showDialog('edit', row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="单位名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="单位编码"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contact_person" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.contact_phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.description" type="textarea" /></el-form-item>
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
import { useUnitApi } from '../../api'
const tableData = ref([])
const page = ref(1), pageSize = ref(20), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增单位')
const form = ref({ id: null, name: '', code: '', contact_person: '', contact_phone: '', address: '', description: '' })

const fetchData = async () => {
  const res = await useUnitApi.list( { params: { page: page.value, page_size: pageSize.value } })
  tableData.value = res.data.data || res.data
  total.value = res.data.total || 0
}
const showDialog = (mode, row = {}) => {
  dialogTitle.value = mode === 'add' ? '新增使用单位' : '编辑使用单位'
  form.value = mode === 'add' ? { name: '', code: '', contact_person: '', contact_phone: '', address: '', description: '' } : { ...row }
  dialogVisible.value = true
}
const handleSave = async () => {
  const payload = { name: form.value.name, code: form.value.code, contact_person: form.value.contact_person, contact_phone: form.value.contact_phone, address: form.value.address, description: form.value.description }
  if (form.value.id) { await axios.put(`/api/use-units/${form.value.id}`, payload) }
  else { await useUnitApi.create( payload) }
  dialogVisible.value = false; fetchData(); ElMessage.success('保存成功')
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await axios.delete(`/api/use-units/${id}`); fetchData(); ElMessage.success('删除成功')
}
onMounted(fetchData)
</script>
