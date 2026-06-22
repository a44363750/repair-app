<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showDialog('add')">新增耗材</el-button>
      <el-button @click="fetchCategories">刷新分类</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="耗材名称" />
      <el-table-column prop="code" label="耗材编码" width="120" />
      <el-table-column prop="category_name" label="分类" width="100" />
      <el-table-column prop="unit" label="单位" width="60" />
      <el-table-column prop="stock_quantity" label="库存" width="80" />
      <el-table-column prop="unit_price" label="单价" width="80" />
      <el-table-column prop="location" label="存放地点" />
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
        <el-form-item label="耗材名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="耗材编码"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" placeholder="选择分类" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item>
        <el-form-item label="单价"><el-input v-model="form.unit_price" type="number" /></el-form-item>
        <el-form-item label="库存"><el-input v-model="form.stock_quantity" type="number" /></el-form-item>
        <el-form-item label="最低库存"><el-input v-model="form.min_stock" type="number" /></el-form-item>
        <el-form-item label="存放地点"><el-input v-model="form.location" /></el-form-item>
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
import { materialApi, materialCategoryApi } from '../api'
const tableData = ref([]), categories = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增耗材')
const form = ref({ id: null, name: '', code: '', category_id: null, unit: '', unit_price: 0, stock_quantity: 0, min_stock: 0, location: '', remarks: '' })

const fetchData = async () => {
  loading.value = true
  try {
    const res = await materialApi.list( { page: page.value, page_size: pageSize.value })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
const fetchCategories = async () => {
  const res = await materialCategoryApi.list()
  categories.value = res.data.data || res.data || []
}
const showDialog = (mode, row = {}) => {
  dialogTitle.value = mode === 'add' ? '新增耗材' : '编辑耗材'
  form.value = mode === 'add' ? { name: '', code: '', category_id: null, unit: '', unit_price: 0, stock_quantity: 0, min_stock: 0, location: '', remarks: '' } : { ...row }
  dialogVisible.value = true
}
const handleSave = async () => {
  if (form.value.id) await axios.put(`/api/materials/${form.value.id}`, form.value)
  else await materialApi.create( form.value)
  dialogVisible.value = false; fetchData(); ElMessage.success('保存成功')
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await axios.delete(`/api/materials/${id}`); fetchData(); ElMessage.success('删除成功')
}
onMounted(() => { fetchData(); fetchCategories() })
</script>
