<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>公司部门</span>
        <el-button type="primary" @click="handleAdd">新增部门</el-button>
      </div>
    </template>
    
    <el-table :data="tableData" border stripe v-loading="loading" row-key="id" default-expand-all>
      <el-table-column prop="name" label="部门名称" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑部门' : '新增部门'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="form.parent_id" placeholder="顶级部门" clearable style="width: 100%">
            <el-option v-for="dept in tableData" :key="dept.id" :label="dept.name" :value="dept.id" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { departmentApi } from '../../api'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = reactive({ name: '', parent_id: null })
const rules = { name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }] }
const formRef = ref()

const loadData = async () => {
  loading.value = true
  try {
    tableData.value = await departmentApi.list()
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { name: '', parent_id: null })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该部门吗？', '提示', { type: 'warning' })
    .then(async () => {
      await departmentApi.delete(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await departmentApi.update(editId.value, form)
    } else {
      await departmentApi.create(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '操作失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>