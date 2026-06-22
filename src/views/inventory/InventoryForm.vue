<template>
  <el-card>
    <template #header>新建盘点任务</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="任务名称" prop="task_name">
        <el-input v-model="form.task_name" />
      </el-form-item>
      <el-form-item label="开始日期" prop="start_date">
        <el-date-picker v-model="form.start_date" type="date" style="width: 100%" />
      </el-form-item>
      <el-form-item label="结束日期" prop="end_date">
        <el-date-picker v-model="form.end_date" type="date" style="width: 100%" />
      </el-form-item>
      <el-form-item label="选择资产">
        <el-transfer
          v-model="form.asset_ids"
          :data="assets"
          :titles="['可选资产', '已选资产']"
          filterable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">创建</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { inventoryApi, assetApi } from '../../api'

const router = useRouter()
const formRef = ref()

const form = reactive({
  task_name: '',
  start_date: null,
  end_date: null,
  asset_ids: []
})

const rules = {
  task_name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

const assets = ref([])

const loadAssets = async () => {
  const res = await assetApi.list({ limit: 1000 })
  assets.value = res.items.map(a => ({ key: a.id, label: `${a.asset_code} - ${a.name}` }))
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    await inventoryApi.create({
      task_name: form.task_name,
      start_date: form.start_date,
      end_date: form.end_date,
      asset_ids: form.asset_ids
    })
    ElMessage.success('创建成功')
    router.push('/inventory')
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '创建失败')
  }
}

onMounted(loadAssets)
</script>